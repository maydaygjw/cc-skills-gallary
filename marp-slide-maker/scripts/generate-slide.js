#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Marp Slide Generator
 * Creates Marp-compatible slide decks from templates and user input
 */

class MarpSlideGenerator {
  constructor() {
    this.templates = {
      basic: this.createBasicTemplate,
      technical: this.createTechnicalTemplate,
      presentation: this.createPresentationTemplate,
      workshop: this.createWorkshopTemplate
    };
  }

  /**
   * Create a basic presentation template
   */
  createBasicTemplate(options = {}) {
    const {
      title = "My Presentation",
      author = "Presenter Name",
      theme = "default",
      slides = []
    } = options;

    let markdown = `---
theme: ${theme}
title: ${title}
paginate: true
---

# ${title}

${author ? `###### ${author}` : ''}

---

`;

    // Add user-provided slides or default content
    if (slides.length > 0) {
      slides.forEach((slide, index) => {
        if (index > 0) { // Skip the first slide as it's the title
          markdown += `# ${slide.title || `Slide ${index + 1}`}\n\n`;
          markdown += `${slide.content || 'Content goes here'}\n\n---\n\n`;
        }
      });
    } else {
      markdown += `# Agenda

- Introduction
- Main Points
- Conclusion
- Questions

---

# Introduction

Brief overview of the topic

---

# Main Points

Key information to convey

---

# Conclusion

Summary and next steps

---

# Thank You!

Questions?

`;
    }

    return markdown.trim();
  }

  /**
   * Create a technical presentation template
   */
  createTechnicalTemplate(options = {}) {
    const {
      title = "Technical Presentation",
      author = "Developer Name",
      theme = "default",
      slides = []
    } = options;

    let markdown = `---
theme: ${theme}
title: ${title}
paginate: true
math: katex
---

# ${title}

${author ? `###### ${author}` : ''}

---

# Overview

- Problem Statement
- Solution Approach
- Implementation
- Results & Future Work

---

# Problem Statement

Describe the challenge or issue we're addressing

---

# Solution Approach

- Architecture overview
- Key technologies used
- Design decisions

---

# Implementation

\`\`\`javascript
// Example code snippet
function example() {
  return "Hello, Marp!";
}
\`\`\`

---

# Results

- Metrics achieved
- Performance improvements
- User feedback

---

# Future Work

- Next steps
- Planned enhancements
- Potential challenges

---

# Thank You

Questions & Discussion

`;

    return markdown.trim();
  }

  /**
   * Create a presentation template with more features
   */
  createPresentationTemplate(options = {}) {
    const {
      title = "Professional Presentation",
      author = "Speaker Name",
      theme = "gaia",
      header = "Company Name",
      footer = "Confidential",
      slides = []
    } = options;

    let markdown = `---
theme: ${theme}
title: ${title}
header: ${header}
footer: ${footer}
paginate: true
---

<!-- _class: lead -->

# ${title}

${author ? `###### ${author}` : ''}

---

<!-- paginate: true -->

# Agenda

1. Introduction
2. Main Content
3. Analysis
4. Conclusions
5. Q&A

---

# Introduction

Context for the presentation

---

# Main Content

Detailed information

---

# Analysis

Data and insights

---

# Conclusions

Key takeaways

---

<!-- _footer: '' -->

# Questions?

Thank you for your attention!

`;

    return markdown.trim();
  }

  /**
   * Create a workshop template
   */
  createWorkshopTemplate(options = {}) {
    const {
      title = "Workshop Session",
      author = "Facilitator Name",
      theme = "uncover",
      slides = []
    } = options;

    let markdown = `---
theme: ${theme}
title: ${title}
paginate: true
---

<!-- _class: lead -->

# ${title}

${author ? `###### ${author}` : ''}

---

# Workshop Goals

- Learn something new
- Practice skills
- Collaborate effectively

---

# Schedule

| Time | Activity |
|------|----------|
| 9:00 | Welcome & Introductions |
| 9:30 | Topic Overview |
| 10:30 | Hands-on Exercise |
| 12:00 | Lunch Break |
| 13:00 | Continued Session |
| 15:30 | Wrap-up & Q&A |

---

# Materials Needed

- Laptop with installed software
- Notebook
- Positive attitude

---

# Exercise: Hands-on Activity

Practical application of concepts

---

# Breakout Groups

Collaborative problem solving

---

# Review & Discussion

Share learnings and insights

---

# Next Steps

- Resources for further learning
- Follow-up activities
- Contact information

---

# Thank You!

Questions & Feedback Welcome!

`;

    return markdown.trim();
  }

  /**
   * Generate slides based on template and options
   */
  generate(templateName = 'basic', options = {}) {
    const templateFunc = this.templates[templateName];

    if (!templateFunc) {
      throw new Error(`Unknown template: ${templateName}. Available templates: ${Object.keys(this.templates).join(', ')}`);
    }

    return templateFunc.call(this, options);
  }

  /**
   * Save slides to a file
   */
  saveToFile(content, filename) {
    const filePath = path.resolve(filename);
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  /**
   * List available templates
   */
  listTemplates() {
    return Object.keys(this.templates);
  }
}

// Command line interface
function main() {
  const generator = new MarpSlideGenerator();

  if (process.argv.includes('--list-templates') || process.argv.includes('-l')) {
    console.log('Available templates:');
    generator.listTemplates().forEach(template => console.log(`- ${template}`));
    return;
  }

  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
Usage: node generate-slide.js [options] [template] [output-file]

Options:
  -l, --list-templates    List all available templates
  -h, --help              Show this help message

Examples:
  node generate-slide.js basic presentation.md
  node generate-slide.js technical --title "Tech Talk" presentation.md
  node generate-slide.js -l
    `);
    return;
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  let template = 'basic';
  let outputFile = 'presentation.md';
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--title' && i + 1 < args.length) {
      options.title = args[i + 1];
      i++; // Skip next argument as it's been consumed
    } else if (arg.startsWith('--title=')) {
      options.title = arg.split('=')[1];
    } else if (arg === '--author' && i + 1 < args.length) {
      options.author = args[i + 1];
      i++; // Skip next argument as it's been consumed
    } else if (arg.startsWith('--author=')) {
      options.author = arg.split('=')[1];
    } else if (arg === '--theme' && i + 1 < args.length) {
      options.theme = args[i + 1];
      i++; // Skip next argument as it's been consumed
    } else if (arg.startsWith('--theme=')) {
      options.theme = arg.split('=')[1];
    } else if (arg === '--header' && i + 1 < args.length) {
      options.header = args[i + 1];
      i++; // Skip next argument as it's been consumed
    } else if (arg.startsWith('--header=')) {
      options.header = arg.split('=')[1];
    } else if (arg === '--footer' && i + 1 < args.length) {
      options.footer = args[i + 1];
      i++; // Skip next argument as it's been consumed
    } else if (arg.startsWith('--footer=')) {
      options.footer = arg.split('=')[1];
    } else if (arg.startsWith('--')) {
      // Skip other options for now
    } else if (generator.templates[arg]) {
      template = arg;
    } else if (arg.endsWith('.md')) {
      outputFile = arg;
    }
  }

  try {
    const content = generator.generate(template, options);
    const filePath = generator.saveToFile(content, outputFile);
    console.log(`Marp slide deck generated successfully: ${filePath}`);
  } catch (error) {
    console.error('Error generating slides:', error.message);
    process.exit(1);
  }
}

// Only run main if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = MarpSlideGenerator;