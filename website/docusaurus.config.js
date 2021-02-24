module.exports = {
  title: "useFormo",
  tagline: "useFormo",
  url: "https://buildo.github.io",
  baseUrl: "/useFormo/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "buildo",
  projectName: "useFormo",
  themeConfig: {
    navbar: {
      title: "useFormo",
      logo: {
        alt: "useFormo",
        src: "img/logo.svg",
      },
      items: [
        {
          href: "https://github.com/buildo/useFormo",
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
          editUrl: "https://github.com/buildo/useFormo/edit/main/website/",
          routeBasePath: "/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
};
