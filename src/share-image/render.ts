import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Renders the share image of a Post without a cover: its title over the site
 * name, in Schibsted Grotesk on Nord's darkest background, at link preview
 * size, with the site's favicon at the bottom right, in line with the name.
 *
 * The same title renders to the same pixels on any machine that builds the
 * site. Text is drawn by the libvips that ships with `sharp`, from the font
 * file in this folder, with this folder's fontconfig configuration instead of
 * the build machine's, so neither its installed fonts nor its hinting and
 * antialiasing settings change the result.
 */
export async function renderShareImage({
  title,
  siteName,
}: {
  title: string;
  siteName: string;
}): Promise<Uint8Array<ArrayBuffer>> {
  useOwnFontConfig();
  const logo = await renderLogo();
  const nameWidth = logo ? maxTextWidth - logo.width - logoGap : maxTextWidth;
  const name = await renderText(siteName, nameStyle, nameWidth);
  // The name and the logo share the bottom line, their middles in line.
  const footerHeight = Math.max(name.height, logo ? logoHeight : 0);
  const footerMiddle = size.height - margin - footerHeight / 2;
  const titleHeight = size.height - 2 * margin - nameGap - footerHeight;
  const titleText = await fitTitle(title, titleHeight);
  const png = await sharp({
    create: { ...size, channels: 3, background: colors.background },
  })
    .composite([
      { input: titleText.data, left: margin, top: margin },
      {
        input: name.data,
        left: margin,
        top: Math.round(footerMiddle - name.height / 2),
      },
      ...(logo
        ? [
            {
              input: logo.data,
              left: size.width - margin - logo.width,
              top: Math.round(footerMiddle - logoHeight / 2),
            },
          ]
        : []),
    ])
    .png()
    .toBuffer();
  return new Uint8Array(png);
}

/** The size link previews show images at. */
const size = { width: 1200, height: 630 };

/** The space around the text on every side, in pixels. */
const margin = 80;

/** The least space between the title and the site name, in pixels. */
const nameGap = 40;

/** The widest a line of text can be before it wraps, in pixels. */
const maxTextWidth = size.width - 2 * margin;

/**
 * How tall the logo is, in pixels: larger than the site name's letters, so
 * it reads as a mark rather than another letter, but not so large that it
 * competes with the name.
 */
const logoHeight = 40;

/** The least space between the site name and the logo, in pixels. */
const logoGap = 40;

/**
 * Copies of the dark Color mode's roles in src/styles/global.css, which the
 * renderer can't read. Change them here too when those roles change.
 */
const colors = {
  /** nord0, the dark Color mode's background. */
  background: "#2e3440",
  /** nord6, the dark Color mode's text. */
  title: "#eceff4",
  /** nord8, the dark Color mode's accent. */
  name: "#88c0d0",
};

/** How a piece of text is set, in Pango's terms. */
interface TextStyle {
  /** A named instance of the variable font, e.g. "ExtraBold". */
  weight: string;
  /** The font size in pixels. */
  fontSize: number;
  color: string;
  /** Letter-spacing in em. */
  letterSpacing: number;
  /** Line-height as a multiple of the font size. */
  lineHeight: number;
}

const nameStyle: TextStyle = {
  weight: "SemiBold",
  fontSize: 36,
  color: colors.name,
  letterSpacing: -0.01,
  lineHeight: 1.1,
};

/**
 * The title's sizes, largest first. It is set at the largest one it fits
 * the space at, like the site's page headings: heavy, with tight
 * letter-spacing and line-height.
 */
const titleStyles: TextStyle[] = [96, 84, 72, 64, 56].map((fontSize) => ({
  weight: "ExtraBold",
  fontSize,
  color: colors.title,
  letterSpacing: -0.035,
  lineHeight: 0.95,
}));

/** What a title too long for the smallest size is cut to end with. */
const ellipsis = "…";

/** Where this folder is: the font file and the fontconfig configuration. */
const assetsDir = path.resolve("src/share-image");

/** The theme's typeface, as a variable font. */
const fontFile = path.join(assetsDir, "SchibstedGrotesk-Variable.ttf");

/**
 * The site's favicon, which the share images show as their logo, so a
 * different favicon changes them too.
 */
const faviconFile = path.resolve("public/favicon.svg");

/** The logo, rendered, as a PNG on the share image's background. */
interface RenderedLogo {
  data: Buffer;
  width: number;
}

/**
 * Renders the favicon on the share image's background, trimmed to what shows
 * there and scaled to the logo's height, or returns nothing when the site has
 * no `favicon.svg`. The Theme's favicon is a mark on a square of the same
 * background color, so only the mark shows, and it lines up with the margin.
 */
async function renderLogo(): Promise<RenderedLogo | undefined> {
  if (!existsSync(faviconFile)) return undefined;
  // Rasterized well above the logo's size and scaled down, so it stays sharp.
  // 72 dpi is one pixel per SVG unit.
  const { width = 1, height = 1 } = await sharp(faviconFile).metadata();
  const density = (72 * 8 * logoHeight) / Math.max(width, height);
  // Separate steps, since in one pipeline sharp trims before it flattens.
  const flattened = await sharp(faviconFile, { density })
    .flatten({ background: colors.background })
    .png()
    .toBuffer();
  const trimmed = await sharp(flattened)
    .trim({ background: colors.background })
    .png()
    .toBuffer();
  const { data, info } = await sharp(trimmed)
    .resize({ height: logoHeight })
    .png()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width };
}

/**
 * Points fontconfig at this folder's configuration. libvips reads it the
 * first time it renders text in a process, so it must be set before that.
 */
function useOwnFontConfig() {
  process.env.FONTCONFIG_FILE = path.join(assetsDir, "fonts.conf");
}

/** A rendered piece of text, as a PNG with a transparent background. */
interface RenderedText {
  data: Buffer;
  height: number;
}

/**
 * Sets the title at the largest size it fits `maxHeight` at. If it doesn't
 * fit at the smallest size, it's cut at a word and ends with an ellipsis.
 */
async function fitTitle(
  title: string,
  maxHeight: number,
): Promise<RenderedText> {
  for (const style of titleStyles) {
    const text = await renderText(title, style, maxTextWidth);
    if (text.height <= maxHeight) return text;
  }
  const smallest = titleStyles[titleStyles.length - 1];
  const words = title.split(/\s+/);
  // The most words that fit, found by halving the range each time.
  let [low, high] = [0, words.length - 1];
  let best = await renderText(ellipsis, smallest, maxTextWidth);
  while (low < high) {
    const count = Math.ceil((low + high) / 2);
    // Punctuation the cut leaves at the end goes, e.g. "Engine," becomes
    // "Engine…".
    const cut = words
      .slice(0, count)
      .join(" ")
      .replace(/[,;:.\-–—]+$/, "");
    const text = await renderText(`${cut}${ellipsis}`, smallest, maxTextWidth);
    if (text.height <= maxHeight) {
      [low, best] = [count, text];
    } else {
      high = count - 1;
    }
  }
  return best;
}

/** Renders `text` in `style`, wrapping at word breaks to `width`. */
async function renderText(
  text: string,
  style: TextStyle,
  width: number,
): Promise<RenderedText> {
  // Pango's letter_spacing is in 1024ths of a point, and at 72 dpi a point
  // is a pixel.
  const letterSpacing = Math.round(style.letterSpacing * style.fontSize * 1024);
  const markup = `<span foreground="${style.color}" letter_spacing="${letterSpacing}" line_height="${style.lineHeight}">${escapeMarkup(text)}</span>`;
  const { data, info } = await sharp({
    text: {
      text: markup,
      // At 72 dpi, a point is a pixel.
      font: `Schibsted Grotesk ${style.weight} ${style.fontSize}`,
      fontfile: fontFile,
      width,
      dpi: 72,
      rgba: true,
      // A word too long for a line of its own breaks between letters.
      wrap: "word-char",
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true });
  return { data, height: info.height };
}

/** Escapes text for Pango markup, so a title can't be read as markup. */
function escapeMarkup(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
