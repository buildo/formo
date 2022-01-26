module.exports = {
  title: "formo",
  tagline: "formo",
  url: "https://buildo.github.io",
  baseUrl: "/formo/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "buildo",
  projectName: "formo",
  themeConfig: {
    navbar: {
      title: "formo",
      logo: {
        alt: "formo",
        src: "img/logo.svg",
      },
      items: [
        {
          href: "https://github.com/buildo/formo",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [],
      copyright: `Copyright © ${new Date().getFullYear()} buildo srl. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          editUrl: "https://github.com/buildo/formo/edit/main/website/",
          routeBasePath: "/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
    [
      "docusaurus-preset-shiki-twoslash",
      {
        themes: ["min-light", "one-dark-pro"],
      },
    ],
  ],
};
