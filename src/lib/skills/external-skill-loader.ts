/**
 * External Skill Loader
 *
 * This module handles loading skills from external directories.
 * 
 * IMPORTANT: The browser cannot directly access the filesystem. Instead,
 * skills should be loaded by the UAR's FilesystemStorageProvider which
 * scans directories for SKILL.md files.
 * 
 * For the artifact-refiner skill located at:
 * /Users/gqadonis/Projects/travisjames/skills/artifact-refiner
 * 
 * The UAR should be configured with a FilesystemStorageProvider pointing
 * to that directory. The skill will then appear in the API automatically.
 * 
 * This module now only provides utility functions for parsing SKILL.md
 * content if needed, but does not attempt filesystem access from the browser.
 */

import type { KnowMeSkillDefinition } from "./knowme-skills";

/**
 * Parse a SKILL.md file into a skill definition.
 * The file format is:
 * ---
 * name: skill-name
 * version: "1.0.0"
 * description: Skill description
 * authors: ["Author Name"]
 * triggers:
 *   keywords: ["keyword1", "keyword2"]
 *   semantic: "Semantic description"
 * tools: ["tool1", "tool2"]
 * ---
 * 
 * # Markdown body (prompt_overlay)
 * ...
 */
export function parseSkillMd(content: string): KnowMeSkillDefinition | null {
  // Check for YAML frontmatter
  if (!content.startsWith("---")) {
    console.error("Skill file missing YAML frontmatter");
    return null;
  }

  const parts = content.split("---");
  if (parts.length < 3) {
    console.error("Invalid skill file format - expected frontmatter delimiters");
    return null;
  }

  const yamlContent = parts[1].trim();
  const bodyContent = parts.slice(2).join("---").trim();

  try {
    // Parse YAML frontmatter manually (simple parser for our needs)
    const manifest = parseYamlFrontmatter(yamlContent);
    
    if (!manifest.name) {
      console.error("Skill manifest missing required 'name' field");
      return null;
    }

    const skillId = manifest.name.toLowerCase().replace(/\s+/g, "-");

    return {
      skill_id: skillId,
      title: manifest.name,
      version: manifest.version || "1.0.0",
      description: manifest.description || "",
      enabled: true,
      source: "platform",
      category: "productivity",
      triggers: {
        keywords: manifest.triggers?.keywords || [],
        semantic: manifest.triggers?.semantic || "",
      },
      prompt_overlay: bodyContent,
      preferred_tools: manifest.tools || [],
    };
  } catch (error) {
    console.error("Failed to parse skill manifest:", error);
    return null;
  }
}

interface SkillManifest {
  name: string;
  version?: string;
  description?: string;
  authors?: string[];
  triggers?: {
    keywords?: string[];
    semantic?: string;
  };
  tools?: string[];
}

/**
 * Simple YAML frontmatter parser for skill manifests.
 * Handles the specific structure we need for skills.
 */
function parseYamlFrontmatter(yaml: string): SkillManifest {
  const manifest: SkillManifest = {
    name: "",
  };

  const lines = yaml.split("\n");
  let currentKey: string | null = null;
  let currentArray: string[] | null = null;
  let inTriggers = false;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) continue;

    // Check for key: value pairs
    const keyValueMatch = trimmed.match(/^(\w+):\s*(.*)$/);
    if (keyValueMatch) {
      const [, key, value] = keyValueMatch;
      
      // End any previous array
      if (currentArray && currentKey) {
        (manifest as unknown as Record<string, unknown>)[currentKey] = currentArray;
        currentArray = null;
      }

      if (key === "triggers") {
        inTriggers = true;
        manifest.triggers = {};
        currentKey = null;
      } else if (inTriggers) {
        // This is a triggers sub-key
        if (key === "keywords") {
          manifest.triggers!.keywords = [];
          currentArray = manifest.triggers!.keywords;
          currentKey = "keywords";
        } else if (key === "semantic") {
          manifest.triggers!.semantic = value.replace(/^["']|["']$/g, "");
        }
      } else if (key === "tools") {
        manifest.tools = [];
        currentArray = manifest.tools;
        currentKey = "tools";
      } else if (key === "authors") {
        manifest.authors = [];
        currentArray = manifest.authors;
        currentKey = "authors";
      } else {
        // Simple string value
        const cleanValue = value.replace(/^["']|["']$/g, "");
        (manifest as unknown as Record<string, unknown>)[key] = cleanValue;
        currentKey = null;
      }
    } else if (trimmed.startsWith("- ") && currentArray) {
      // Array item
      const item = trimmed.slice(2).replace(/^["']|["']$/g, "");
      currentArray.push(item);
    } else if (trimmed === "" || trimmed.startsWith("#")) {
      // End of section
      if (inTriggers && !trimmed.startsWith(" ")) {
        inTriggers = false;
      }
    }
  }

  // Handle any remaining array
  if (currentArray && currentKey) {
    (manifest as unknown as Record<string, unknown>)[currentKey] = currentArray;
  }

  return manifest;
}

/**
 * Load external skills from the filesystem.
 * 
 * NOTE: This function is designed to be called during build time or from
 * a server environment, NOT from the browser. The browser cannot access
 * the local filesystem.
 * 
 * For browser use, skills should be loaded via the UAR API, which uses
 * the FilesystemStorageProvider to scan directories.
 */
export async function loadExternalSkills(): Promise<KnowMeSkillDefinition[]> {
  // This function should only be called in Node.js/build context
  if (typeof window !== "undefined") {
    console.warn("loadExternalSkills should not be called from browser. Skills should be loaded via UAR API.");
    return [];
  }

  // In a server/build context, this would read from the filesystem
  // For now, return empty as the UAR should load these via FilesystemStorageProvider
  return [];
}
