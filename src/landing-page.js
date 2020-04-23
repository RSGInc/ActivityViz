var app = new Vue({
  el: "#app",
  data: {
    defaultRegionKey: "",
    icon: "",
    logo: "",
    logoSrc: "",
    sideBarImageSrc: "",
    sideBarLogoSrc: "",
    faviconUrl: '',
    title: "ActivityViz",
    linkURL: "",
    navbarTitle: ".",
    configuration: null,
    defaultRegion: null,
    rawRegionsArray: []
  },
  computed: {
    regionKeys() {
      return this.configuration ? Object.keys(this.configuration.regions) : [];
    },
    regionsArray() {
      if (this.regionKeys.length === 0) {
        return this.rawRegionsArray;
      }
      return this.rawRegionsArray.sort((a, b) => {
        return (
          this.regionKeys.indexOf(a.regionKey) -
          this.regionKeys.indexOf(b.regionKey)
        );
      });
    }
  },
  methods: {
    scenarioUrl(regionKey, scenarioKey) {
      return "src/index.html?region=" + regionKey + "&scenario=" + scenarioKey;
    },
    scenarioLabel(scenario) {
      var label = scenario.label ? scenario.label : scenario.title;
      label = label.trim();
      if (label[0] === "-") {
        label = label.slice(1).trim();
      }
      return label;
    }
  },
  created() {
    var vueInstance = this;
    $.getJSON("config.json", function(data) {
      vueInstance.configuration = data;
      for (let k in vueInstance.configuration.regions) {
        let v = vueInstance.configuration.regions[k];

        if (!vueInstance.defaultRegionKey) {
          vueInstance.defaultRegionKey = k;
          vueInstance.defaultRegion = v;
        }

        localStorage.setItem(k, v.datalocation);
        $.getJSON(v.datalocation + "region.json", function(reg) {
          v.region = reg;
          reg.regionKey = k;
          reg.datalocation = v.datalocation;
          vueInstance.rawRegionsArray.push(reg);

          if (vueInstance.defaultRegionKey === k) {
            // take data from the first region in config.json and bind it to the homepage.
            document.querySelector("title").innerText = reg.Title;
            vueInstance.navbarTitle = reg.NavbarTitle;
            vueInstance.logo = reg.Logo;

            vueInstance.linkURL = reg.LinkURL;

            vueInstance.logoSrc = getImageUrl(reg.Logo);
            vueInstance.sideBarImageSrc = getImageUrl(reg.SideBarImage);
            vueInstance.sideBarLogoSrc = getImageUrl(reg.SideBarLogo)
            vueInstance.icon = getImageUrl(reg.Icon);
          }

          function getImageUrl(path) {
            return path ? vueInstance.defaultRegion.datalocation + "img/" + path : '';
          }
        });
      }
    });
  }
});
