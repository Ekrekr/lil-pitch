import { ChakraProvider, defineRecipe } from "@chakra-ui/react";
import { ColorModeProvider } from "./color-mode";
import { createSystem, defaultConfig } from "@chakra-ui/react";
import "@fontsource-variable/figtree/index.css";
import { ThemeProviderProps } from "next-themes";

// These are just the default grays from material design
// https://m2.material.io/design/color/the-color-system.html#tools-for-picking-colors
const SHADES = {
  "900": "#212121",
  "800": "#424242",
  "700": "#616161",
  "600": "#757575",
  "500": "#9E9E9E",
  "400": "#BDBDBD",
  "300": "#E0E0E0",
  "200": "#EEEEEE",
  "100": "#F5F5F5",
  "50": "#FAFAFA",
  "0": "#ffffff",
};

// TODO(ekrekr): generate a better palette.
const PRIMARY = SHADES;

// These are the base styles used by the component system.
const system = createSystem(defaultConfig, {
  theme: {
    semanticTokens: {
      colors: {
        text: { value: { _light: SHADES["900"], _dark: SHADES["50"] } },
        background: { value: { _light: SHADES["50"], _dark: SHADES["900"] } },
        backgroundAlt: { value: { _light: SHADES["0"], _dark: SHADES["800"] } },
        primary: { value: { _light: PRIMARY["900"], _dark: PRIMARY["300"] } },
        primaryAlt: {
          value: { _light: PRIMARY["300"], _dark: PRIMARY["900"] },
        },
        // secondary: { value: { _light: "#26532B", _dark: "#80B192" } },
        // secondaryAlt: { value: { _light: "#80B192", _dark: "#26532B" } },
      },
      fonts: {
        heading: { value: `Figtree Variable` },
        body: { value: `Figtree Variable` },
      },
    },
    recipes: {
      button: defineRecipe({
        defaultVariants: {
          variant: "solid",
        },
        variants: {
          variant: {
            solid: {
              color: "{colors.background}",
              backgroundColor: "{colors.primary}",
              _hover: {
                backgroundColor: "{colors.primary}",
                opacity: "90%",
              },
            },
            outline: {
              color: "{colors.primary}",
              backgroundColor: "{colors.background}",
              borderColor: "{colors.primary}",
              _hover: {
                backgroundColor: "{colors.backgroundAlt}",
              },
            },
          },
        },
      }),
      tag: defineRecipe({
        defaultVariants: {
          variant: "solid",
        },
        variants: {
          variant: {
            solid: {
              color: "{colors.background}",
              backgroundColor: "{colors.primary}",
            },
            outline: {
              color: "{colors.primary}",
              backgroundColor: "{colors.background}",
              borderColor: "{colors.primary}",
            },
          },
        },
      }),
      link: defineRecipe({
        defaultVariants: {
          variant: "solid",
        },
        variants: {
          variant: {
            solid: {
              color: "{colors.primary}",
              textDecoration: "none",
              _hover: {
                color: "{colors.primaryAlt}",
              },
            },
          },
        },
      }),
    },
  },
  globalCss: {
    h1: {
      marginTop: "1em",
    },
    h2: {
      marginTop: "0.6em",
    },
    h3: {
      marginTop: "0.4em",
    },
    h4: {
      marginTop: "0.3em",
    },
    li: {
      marginLeft: "2em",
    },
    body: {
      color: "{colors.text}",
      backgroundColor: "{colors.background}",
    },
    html: {
      scrollBehavior: "smooth",
    },
  },
  strictTokens: true,
});

export function Provider(props: ThemeProviderProps) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  );
}
