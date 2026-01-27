# Marp Slide Maker - Complete Example

## Creating a Technical Presentation

Here's a complete example of creating a technical presentation using the Marp Slide Maker skill:

### Step 1: Generate the Presentation

```bash
# Create a technical presentation about JavaScript frameworks
node scripts/generate-slide.js technical --title "Modern JavaScript Frameworks" --author "Tech Expert" js-frameworks-talk.md
```

### Step 2: Generated Output (js-frameworks-talk.md)

The command above would generate a complete Marp presentation:

```markdown
---
theme: default
title: Modern JavaScript Frameworks
paginate: true
math: katex
---

# Modern JavaScript Frameworks

###### Tech Expert

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

```javascript
// Example code snippet
function example() {
  return "Hello, Marp!";
}
```

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
```

### Step 3: Convert to Other Formats

After generating the Marp Markdown file, you can convert it to other formats using Marp CLI:

```bash
# Install Marp CLI globally
npm install -g @marp-team/marp-cli

# Convert to PDF
marp js-frameworks-talk.md -o js-frameworks-talk.pdf

# Convert to HTML
marp js-frameworks-talk.md -o js-frameworks-talk.html

# Convert to PowerPoint
marp js-frameworks-talk.md -o js-frameworks-talk.pptx

# Convert to images (one image per slide)
marp js-frameworks-talk.md --images
```

## Customization Options

The Marp Slide Maker supports various customization options:

### Themes
- `default` - Clean, professional look
- `gaia` - Minimalist design
- `uncover` - Bold, colorful design

### Directives
You can set custom directives like headers, footers, and styling:

```bash
node scripts/generate-slide.js presentation --title "My Talk" --header "My Company" --footer "Proprietary" custom-presentation.md
```

### Advanced Usage
You can also use the generator programmatically in your Node.js applications:

```javascript
const MarpSlideGenerator = require('./scripts/generate-slide.js');
const generator = new MarpSlideGenerator();

// Generate custom slides
const slides = generator.generate('technical', {
  title: 'Custom Tech Talk',
  author: 'John Developer',
  theme: 'uncover'
});

// Save to file
generator.saveToFile(slides, 'custom-tech-talk.md');
```

## Best Practices

1. **Start with templates**: Use the appropriate template for your content type
2. **Customize strategically**: Add only the directives you need
3. **Preview frequently**: Use Marp for VS Code extension to preview changes
4. **Keep slides focused**: One main idea per slide
5. **Use consistent formatting**: Stick to the template's style patterns

This skill makes it easy to generate professional slide decks with consistent formatting and proper Marp syntax, saving you time and ensuring your presentations look polished.