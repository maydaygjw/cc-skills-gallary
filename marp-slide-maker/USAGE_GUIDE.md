# Marp Slide Maker Templates

## Built-in Templates

The Marp Slide Maker includes several built-in templates to get you started quickly:

### 1. Basic Template (`basic`)
- Simple, clean presentation format
- Standard title slide followed by agenda and content slides
- Good for general presentations
- Uses default theme

### 2. Technical Template (`technical`)
- Geared toward technical audiences
- Includes code blocks and mathematical expressions
- Covers problem, solution, implementation, and results
- Uses KaTeX for math rendering

### 3. Presentation Template (`presentation`)
- Professional presentation format
- Includes headers, footers, and advanced styling
- Uses gaia theme by default
- Contains slide classes for special formatting

### 4. Workshop Template (`workshop`)
- Designed for interactive sessions
- Includes schedule and material lists
- Breakout group sections
- Uses uncover theme by default

## Creating Custom Presentations

### Command Line Usage
```bash
# Generate a basic presentation
node scripts/generate-slide.js basic my-presentation.md

# Generate a technical presentation with custom title
node scripts/generate-slide.js technical --title "My Tech Talk" tech-talk.md

# List all available templates
node scripts/generate-slide.js --list-templates
```

### Programmatic Usage
```javascript
const MarpSlideGenerator = require('./scripts/generate-slide.js');
const generator = new MarpSlideGenerator();

// Generate basic slides
const slides = generator.generate('basic', {
  title: 'My Presentation',
  author: 'John Doe',
  theme: 'default'
});

// Save to file
generator.saveToFile(slides, 'output.md');
```

## Customizing Your Slides

### Adding Your Own Content
You can customize slides by providing custom slide content:

```javascript
const options = {
  title: 'Custom Presentation',
  author: 'Jane Smith',
  theme: 'gaia',
  slides: [
    { title: 'Introduction', content: 'Welcome to my presentation...' },
    { title: 'Main Point', content: 'Here are the key points...' },
    { title: 'Conclusion', content: 'Thank you for listening!' }
  ]
};

const customSlides = generator.generate('basic', options);
```

### Applying Custom Directives
You can add custom Marp directives to your presentations:

```markdown
---
theme: uncover
title: My Presentation
paginate: true
math: katex
style: |
  section {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  }
  h1 {
    color: #2c3e50;
  }
---
```

## Exporting Your Presentations

Once you have generated your Marp Markdown file, you can export it to various formats using Marp CLI:

```bash
# Install Marp CLI globally
npm install -g @marp-team/marp-cli

# Convert to PDF
marp presentation.md -o presentation.pdf

# Convert to HTML
marp presentation.md -o presentation.html

# Convert to PowerPoint
marp presentation.md -o presentation.pptx

# Convert to images (one image per slide)
marp presentation.md --images
```