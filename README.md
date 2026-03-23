# Toby Geeks Out! — Micro.blog Theme

A warm, editorial theme for [Toby Geeks Out!](https://micro.blog/tobygeeksout)  
Terracotta + Navy palette · Playfair Display headlines · DM Sans body · Mobile-first

---

## Folder Structure

```
tobygeeksout-theme/
├── theme.toml                          ← theme metadata
├── config.json                         ← site params
├── README.md                           ← this file
├── static/
│   └── css/
│       └── custom.css                  ← all styles
└── layouts/
    ├── _default/
    │   ├── baseof.html                 ← master layout
    │   ├── list.html                   ← homepage + feed
    │   ├── single.html                 ← individual post
    │   ├── page.html                   ← static pages (About, Now)
    │   └── list.archivehtml.html       ← archive page
    └── partials/
        ├── head.html                   ← <head> tags + IndieWeb
        ├── header.html                 ← site header + nav
        ├── footer.html                 ← site footer
        └── custom_footer.html          ← required for MB plugins
```

---

## How to Deploy on Micro.blog

### Option A — GitHub (recommended)

1. Create a **public** GitHub repository (e.g. `tobygeeksout-theme`)
2. Push all these files to the repo root
3. In Micro.blog go to **Posts → Design → Edit Custom Themes → New Theme**
4. Paste your GitHub repo URL into the **Clone URL** field
5. Give it a name and save
6. Go back to **Design**, set your design to **Blank**, then select this custom theme
7. Set **Hugo Version** to `0.91` under Design → Hugo Version

### Option B — Edit directly in Micro.blog

1. Go to **Posts → Design → Edit Custom Themes → New Theme**
2. Give it a name (no Clone URL needed)
3. Manually create each file by clicking **New Template** and pasting the content

---

## Updating the Theme

After pushing changes to GitHub:

1. Go to **Design → Edit Custom Themes**
2. Click your theme name
3. Click **Update from GitHub** (or change the version in `theme.toml` to bust cache)

---

## Pinning a Featured Post

By default the featured banner shows your most recent post.  
To pin a specific post, add `featured` to its categories in Micro.blog:

```
categories: ["featured", "Tech"]
```

---

## Key Design Decisions

- **No title posts** are handled gracefully — micro-posts show content directly
- **Short posts** (under ~700 characters) render as micro-cards in the feed
- **Long posts** render with title, excerpt, and a "Keep reading" link
- **Categories** are used (not tags) — this is Micro.blog's taxonomy system
- **Replies** show as conversations on post pages when enabled in Design settings

---

## Hugo Version

This theme requires **Hugo 0.91**. Set this under Design → Hugo Version in Micro.blog.
