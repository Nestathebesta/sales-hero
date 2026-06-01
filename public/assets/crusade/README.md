# Crusade art assets

Drop custom visuals here when you have them from ChatGPT, Nano Banana, or your designer.

Suggested files (optional — wire up in CSS/components later):

| File | Use |
|------|-----|
| `hero-bg.webp` | Full-page background texture (stone, banner, battlefield) |
| `panel-frame.png` | Panel border overlay for cards |
| `avatar-squire.png` | Default crusader portrait |
| `avatar-knight.png` | Knight Errant unlock (level 3) |
| `avatar-crusader.png` | Crusader unlock (level 7) |
| `avatar-commander.png` | Commander unlock (level 12) |
| `logo-mark.svg` | Header emblem beside SalesDex title |

Reference in CSS once added:

```css
.app-container {
  background-image: url('/assets/crusade/hero-bg.webp');
}
```

Until custom art is added, the app uses SVG avatars in `public/avatars/` and the dark crusader theme in `src/index.css`.
