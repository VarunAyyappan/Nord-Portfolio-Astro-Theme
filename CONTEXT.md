# Nord Portfolio Astro Theme

A starter template for a software developer's portfolio site, built with Astro and styled with the Nord color palette. It ships with filler content that an adopter replaces with their own.

## Language

### People

**Adopter**:
The developer who creates their own portfolio from the theme, e.g. via `npm create astro@latest -- --template VarunAyyappan/Nord-Portfolio-Astro-Theme`.
_Avoid_: User, owner, customer

**Visitor**:
Someone viewing a deployed portfolio in a browser.
_Avoid_: User, reader, guest

### The theme

**Theme**:
This repository: a starter template that an adopter copies once and then owns. There is no upgrade path from the theme to an adopter's copy.
_Avoid_: Package, integration, template (alone)

**Filler content**:
The placeholder text, projects, posts and experience shipped with the theme to show off every section, all of which an adopter is expected to replace. It is written as the filler persona, with lorem ipsum wherever paragraphs of prose are needed.
_Avoid_: Dummy data, sample content

**Filler persona**:
The well-known placeholder developer (e.g. Ada Lovelace) whose name and identity the filler content uses.
_Avoid_: Fake user, demo user

**Section**:
A top-level area of a portfolio: Home, Projects, Blog, Experience, About or Contact.
_Avoid_: Page (a section may span several pages), module

**Site config**:
The single place where an adopter sets their identity: name, tagline, social links and their handles, an email subject, Availability, skills, navigation, an optional résumé PDF and the default share image.
_Avoid_: Settings, profile, metadata

**Availability**:
Whether the adopter is looking for work, set once in Site config as one of three settings: open to new opportunities, open to select projects, or not looking. Each shows as a fixed label beside an Aurora dot (green, yellow or red) on Contact and in the Home hero. Left unset, it shows nowhere.
_Avoid_: Status, open to work, hiring status

### Content

**Project**:
A piece of work the adopter showcases, with its own detail page. Up to three projects can be **featured** on the Home section. Drafts don't count.
_Avoid_: Work, portfolio item, case study

**Stack**:
The technologies a Project or Experience entry was built with. It is a description, not a navigation tool, and is never the same thing as a Tag.
_Avoid_: Tech, technologies, tags

**Post**:
A dated piece of writing in the Blog section. A post marked as a draft is never published.
_Avoid_: Article, blog entry, note

**Tag**:
A topic label on a Post, each with its own index page listing the posts that carry it. Only Posts have tags.
_Avoid_: Category, label, topic

**Experience entry**:
One role in the adopter's work history, a short structured record rather than prose.
_Avoid_: Job, position, résumé item

**Education entry**:
One qualification or course of study, shown in the Experience section alongside experience entries.
_Avoid_: Degree, school

**Skill**:
A capability the adopter lists on the Home section, grouped under a heading such as "Languages". Skills describe the adopter, unlike a Stack, which describes a single Project or Experience entry.
_Avoid_: Technology, competency

### Color

**Color mode**:
Whether the site renders dark (Polar Night backgrounds) or light (Snow Storm backgrounds). The visitor picks one of three settings with the color mode toggle: system (follow the OS preference, the default), dark or light. The site remembers the choice.
_Avoid_: Theme (reserved for the starter template itself), dark theme, light theme

**Polar Night**:
Nord's four dark colors (nord0–nord3), used for dark-mode backgrounds and light-mode text.

**Snow Storm**:
Nord's three light colors (nord4–nord6), used for light-mode backgrounds and dark-mode text.

**Frost**:
Nord's four blue-cyan colors (nord7–nord10), the primary accent colors.

**Aurora**:
Nord's five colorful colors (nord11–nord15: red, orange, yellow, green, purple), used for status and secondary accents.
