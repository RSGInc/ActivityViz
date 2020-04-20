$.getJSON("config.json", function(data) {
  let defaultRegion = '';
  for (let k in data.regions) {
    let v = data.regions[k];
    $("#scenarios").append('<div id="' + k + "_id" + '"></div>');
    if (!defaultRegion) {
      defaultRegion = k;
    }
    let dataLocation = v.datalocation;
    localStorage.setItem(k, dataLocation);
    $.ajax({
      method: "GET",
      url: dataLocation + "region.json",
      dataType: "json",
      success: function(reg) {
        let regionTitle = reg.FrontPageTitle;

        if (defaultRegion === k) {
          // take data from the first region in config.json and bind it to the homepage.
          bindDataToHomepage(dataLocation, reg);
        }

        createRegionList(k, regionTitle, dataLocation, reg);
      }
    });
  }
});

function bindDataToHomepage(dataLocation, reg) {
  var icon = reg.Icon;
  var logo = reg.Logo;
  var title = reg.Title;
  var linkURL = reg.LinkURL;
  var navbarTitle = reg.NavbarTitle;
  $("#favicon").attr("href", dataLocation + "img/" + icon + "");
  $("title").text(title);
  $("#title_id").text(navbarTitle);
  $("#navbarlink").attr("href", linkURL);
  $("#logo_id").attr("src", dataLocation + "img/" + logo + "");
  if ("SideBarTextLeft" in reg) {
    $("#sidebarinfoleft p").html(reg.SideBarTextLeft);
  }
  if ("SideBarTextRight" in reg) {
    $("#sidebarinforight P").html(reg.SideBarTextRight);
  }
  if ("SideBarLogo" in reg && reg.SideBarLogo != "") {
    $("#sidebarhead img").attr("src", dataLocation + "img/" + reg.SideBarLogo);
  } else {
    $("#sidebarhead img").remove();
    $("#sidebarhead").css("min-height", "125px");
  }
  if ("SideBarImage" in reg && reg.SideBarImage != "") {
    $("#sidebarimg  img").attr("src", dataLocation + "img/" + reg.SideBarImage);
  } else {
    $("#sidebarimg  img").remove();
  }
}

function createRegionList(regionKey, regionTitle, dataLocation, reg) {
  $("#" + regionKey + "_id").append(
    "<h4>" +
      regionTitle +
      "<img style='max-height: 25px;margin-left:2%;'src='" +
      dataLocation +
      "img/" +
      reg.FrontPageGraphic +
      "" +
      "'/>" +
      "</h4>"
  );

  $("#" + regionKey + "_id").append(
    "<ul id='" +
      regionKey +
      "_scenarios' class='scenarios' style='margin-bottom: 25px;'> </ul>"
  );

  $.each(reg.scenarios, function(key, value) {
    var label = value.label ? value.label : value.title;
    label = label.trim();
    if (label[0] === "-") {
      label = label.slice(1).trim();
    }

    $("#" + regionKey + "_scenarios").append(
      "<li><a class='scenariolink' href='src/index.html?region=" +
        regionKey +
        "&scenario=" +
        key +
        "'>" +
        label +
        "</a></li>"
    );
  });
}
