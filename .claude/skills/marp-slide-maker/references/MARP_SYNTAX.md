# Marp Syntax Reference

## Basic Slide Structure

Each slide is separated by `---` (horizontal rule):

```markdown
# Slide 1 Title

Content for first slide

---

# Slide 2 Title

Content for second slide
```

## Marp Directives

### Global Directives (apply to entire presentation):
- `theme`: Set the presentation theme
- `style`: Add custom CSS
- `size`: Set slide dimensions
- `math`: Configure math rendering
- `title`: Set presentation title
- `author`: Set presentation author

### Local Directives (apply to single slide):
- `paginate`: Show/hide page numbers
- `header`: Add slide header
- `footer`: Add slide footer
- `class`: Add CSS classes
- `backgroundColor`: Set background color
- `backgroundImage`: Set background image
- `color`: Set text color

## Directive Syntax

Using HTML comments:
```markdown
<!--
theme: default
paginate: true
-->
```

Using front matter (at document start):
```markdown
---
theme: default
paginate: true
---
```

## Theming Options

Common themes:
- `default`: Clean, professional look
- `gaia`: Minimalist design
- `uncover`: Bold, colorful design

## Advanced Formatting

### Mathematical Equations
Inline: `$x = y + z$`
Block:
```
$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

### Code Blocks
```javascript
console.log("Hello, World!");
```

### Tables
| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |

### Fragments
Use `*` for fragmented lists that reveal items incrementally:
* Item 1
* Item 2
* Item 3

## Backgrounds and Styling

Custom background color:
```markdown
<!-- backgroundColor: lightblue -->
```

Custom background image:
```markdown
<!-- backgroundImage: url('path/to/image.jpg') -->
```

Scoped directives (only affect current slide):
```markdown
<!-- _color: red -->
```