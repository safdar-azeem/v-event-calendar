import fs from 'fs/promises'
import path from 'path'
import postcss from 'postcss'
import selectorParser from 'postcss-selector-parser'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ==== CONFIG ====
const INPUT_FILE = path.resolve(__dirname, '../dist/style.css')
const OUTPUT_FILE = path.resolve(__dirname, '../dist/style.css')
const PARENT_CLASS = '.v-event-calendar'

// === SKIP CLASSES ===
// utilities here that should *not* be scoped
const SKIP_CLASSES = new Set([
   'v-event-calendar'
])

// === SKIP PATTERNS ===
// Selectors matching these patterns should not be scoped
const SKIP_PATTERNS = []

// === OPTIONS ===
const OPTIONS = {
   rewriteRootToParent: true,
   skipAlreadyScoped: true,
   skipKeyframes: true,
   skipAtRules: ['font-face', 'page'],
   flattenLayers: true,
}

// ---- helper: detect if a rule sits inside a specific at-rule name ----
function isInsideAtRule(rule, names) {
   let p = rule.parent
   while (p) {
      if (p.type === 'atrule') {
         const name = String(p.name || '').toLowerCase()
         if (names.includes(name)) return true
      }
      p = p.parent
   }
   return false
}

// ---- helper: extract rules from nested structures ----
function extractRulesFromAtRule(atRule, extractedRules = []) {
   atRule.each((node) => {
      if (node.type === 'rule') {
         extractedRules.push(node.clone())
      } else if (node.type === 'atrule') {
         if (node.name === 'supports') {
            extractRulesFromAtRule(node, extractedRules)
         } else if (node.name === 'layer') {
            extractRulesFromAtRule(node, extractedRules)
         } else {
            extractedRules.push(node.clone())
         }
      } else {
         extractedRules.push(node.clone())
      }
   })
   return extractedRules
}

// ---- helper: check if a selector segment should be skipped ----
function shouldSkipSelector(text) {
   // Check exact class matches
   if (/^\.[A-Za-z0-9-_]+$/.test(text)) {
      const cls = text.replace(/^\./, '')
      if (SKIP_CLASSES.has(cls)) return true
   }

   // Check pattern matches
   for (const pattern of SKIP_PATTERNS) {
      if (pattern.test(text)) return true
   }

   return false
}

// ---- helper: check if compound selector starts with a skip-pattern class ----
function startsWithSkipPattern(text) {
   for (const pattern of SKIP_PATTERNS) {
      if (pattern.test(text)) return true
   }
   return false
}

// ---- main transform ----
function scopeSelectors(selector, parentClass, opts) {
   const results = []
   selectorParser((selectors) => {
      selectors.each((sel) => {
         const text = sel.toString().trim()

         // skip selectors already scoped
         if (opts.skipAlreadyScoped && text.startsWith(parentClass)) {
            results.push(text)
            return
         }

         // skip :root -> rewrite to parent
         if (opts.rewriteRootToParent && /^:root\b/.test(text)) {
            results.push(parentClass)
            return
         }

         // skip exact single-class selectors in the skip list
         if (shouldSkipSelector(text)) {
            results.push(text)
            return
         }

         // skip compound selectors that start with a specific pattern class
         if (startsWithSkipPattern(text)) {
            results.push(text)
            return
         }

         // otherwise, scope
         results.push(`${parentClass} ${text}`)
      })
   }).processSync(selector)

   return results.join(', ')
}

async function run() {
   try {
      const css = await fs.readFile(INPUT_FILE, 'utf8')
      const root = postcss.parse(css)

      // First pass: flatten @layer rules if enabled
      if (OPTIONS.flattenLayers) {
         const extractedRules = []

         root.walkAtRules('layer', (layerRule) => {
            extractRulesFromAtRule(layerRule, extractedRules)
            layerRule.remove()
         })

         extractedRules.forEach((rule) => {
            root.append(rule)
         })
      }

      // Second pass: scope selectors
      root.walkRules((rule) => {
         if (
            OPTIONS.skipKeyframes &&
            isInsideAtRule(rule, ['keyframes', '-webkit-keyframes', '-moz-keyframes', '-o-keyframes'])
         ) {
            return
         }

         if (isInsideAtRule(rule, OPTIONS.skipAtRules)) {
            return
         }

         if (!rule.selector) return

         const next = scopeSelectors(rule.selector, PARENT_CLASS, OPTIONS)
         rule.selector = next
      })

      // Clean up empty at-rules
      root.walkAtRules((atRule) => {
         if (atRule.name === 'layer' && (!atRule.nodes || atRule.nodes.length === 0)) {
            atRule.remove()
         }
         if (atRule.name === 'supports' && (!atRule.nodes || atRule.nodes.length === 0)) {
            atRule.remove()
         }
      })

      await fs.writeFile(OUTPUT_FILE, root.toString(), 'utf8')
      console.log(`✅ Scoped and flattened CSS written to ${OUTPUT_FILE}`)
   } catch (error) {
      if (error.code === 'ENOENT') {
         console.warn(`⚠️ Warning: Could not find ${INPUT_FILE}. Ensure Vite build finished successfully.`)
      } else {
         throw error
      }
   }
}

run().catch((err) => {
   console.error('❌ Failed to process CSS:', err)
   process.exit(1)
})
