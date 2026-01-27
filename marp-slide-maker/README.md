# Marp Slide Maker

Create beautiful presentation slides using Markdown with the Marp framework.

## Overview

The Marp Slide Maker skill enables you to generate professional slide decks using Marp's Markdown-based presentation system. With this skill, you can create presentations with themes, custom styling, mathematical equations, code blocks, and more - all using simple Markdown syntax.

## Features

- Generate complete Marp slide decks from templates
- Multiple presentation templates for different use cases
- Support for custom themes, styling, and directives
- Command-line interface for quick generation
- Extensible template system

## Prerequisites

To use the generated Marp slides, you'll need to install Marp CLI:

```bash
npm install -g @marp-team/marp-cli
```

## Installation

1. Clone or download this skill directory
2. Navigate to the `marp-slide-maker` directory
3. Install dependencies (optional, only if extending): `npm install`

## Usage

### Command Line Interface

Generate a basic presentation:
```bash
node scripts/generate-slide.js basic output.md
```

Generate a technical presentation with custom title:
```bash
node scripts/generate-slide.js technical --title "My Technical Talk" tech-talk.md
```

List all available templates:
```bash
node scripts/generate-slide.js --list-templates
```

View help:
```bash
node scripts/generate-slide.js --help
```

### Available Templates

- `basic`: Simple presentation with agenda and content
- `technical`: Technical-focused presentation with code and equations
- `presentation`: Professional presentation with advanced styling
- `workshop`: Interactive workshop-style presentation

### Exporting Slides

After generating your Marp Markdown file, convert it to other formats using Marp CLI:

```bash
# Convert to PDF
marp presentation.md -o presentation.pdf

# Convert to HTML
marp presentation.md -o presentation.html

# Convert to PowerPoint
marp presentation.md -o presentation.pptx

# Convert to images
marp presentation.md --images
```

## Validation

To validate the skill structure:
```bash
node validate-skill.js
```

## Packaging

To package the skill for distribution:
```bash
./package-skill.bat  # On Windows
```

## Structure

- `SKILL.md` - Main skill documentation
- `scripts/generate-slide.js` - Core generation logic
- `references/MARP_SYNTAX.md` - Marp syntax reference
- `USAGE_GUIDE.md` - Detailed usage instructions
- `validate-skill.js` - Validation script
- `package.json` - Package configuration
- `package-skill.bat` - Packaging script

## Customization

You can extend the generator by adding new templates to the `MarpSlideGenerator` class in `scripts/generate-slide.js`. Simply add a new method following the same pattern as the existing templates and register it in the `templates` object.

## Examples

The generator has been tested with these commands:
- `node scripts/generate-slide.js basic basic-presentation.md`
- `node scripts/generate-slide.js technical --title "Tech Talk" tech-presentation.md`
- `node scripts/generate-slide.js presentation --author "Speaker" pro-presentation.md`