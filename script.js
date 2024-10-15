require([
    "esri/config",
    "esri/Map",
    "esri/views/MapView",
    "esri/widgets/Search",
    "esri/Graphic",
    "esri/layers/FeatureLayer",
    "esri/geometry/Point",
    "esri/widgets/Popup",
    "esri/rest/support/FeatureSet",
    "esri/widgets/Locate",
    "esri/Basemap"
], function(esriConfig, Map, MapView, Search, Graphic, FeatureLayer, Point, Popup, FeatureSet, Locate, Basemap) {

    // Replace with your actual API key
    esriConfig.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurIMrpomeP09wA2mwDUzsv0qeG0ISCTpeTdFxzbJ-cyUaFo-9XhFvb2y3Ps4A2zWSfrftoqLWuot4lXYMNzoFBkDUoCb8jxcGwyOUD2pISEQQnWWGGZofh7_cB7YvPCG_6nfnOyI48dtNFykpOfUPCCiYNq0iZim3jZ_mF1WVIe8HoKc4qK-GLE0Zeuqls8UmxvtsnKzjGTHgPmbJMjfDrjY2XxUJkTWK0ZizpkBgFuDe6zfjbBtDp76EGl2dOWh1AVAyaY2elCyr_9CmM8n6oe8.AT1_sTU4Pkej";

    const map = new Map({
        basemap: "topo-vector"
      });
    
      const view = new MapView({
        container: "viewDiv",
        map: map,
        center: [-98.5795, 39.8283], // Center of USA
        zoom: 4
      });
    
      // Move zoom widget to bottom-left corner
      view.ui.move("zoom", "bottom-left");
    
      // Add locate widget
      const locateBtn = new Locate({
        view: view
      });
    
      view.ui.add(locateBtn, {
        position: "bottom-left"
      });
    
      // Define the feature layer for eagle sightings
      const eagleLayer = new FeatureLayer({
        url: "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/Midterm_Layer/FeatureServer",
        outFields: ["*"],
        popupTemplate: {
          title: "{Title}",
          content: [
            {
              type: "fields",
              fieldInfos: [
                { fieldName: "Notes", label: "Notes" }
              ]
            },
            {
              type: "text",
              text: `Latitude: {expression/latitude}<br>Longitude: {expression/longitude}`
            },
            {
              type: "custom",
              creator: function(event) {
                const graphic = event.graphic;
                const div = document.createElement("div");
    
                const editBtn = document.createElement("button");
                editBtn.innerText = "Edit";
                editBtn.onclick = function() {
                  editEagle(graphic);
                };
    
                const deleteBtn = document.createElement("button");
                deleteBtn.innerText = "Delete";
                deleteBtn.onclick = function() {
                  deleteEagle(graphic);
                };
    
                div.appendChild(editBtn);
                div.appendChild(deleteBtn);
                return div;
              }
            }
          ],
          expressionInfos: [
            {
              name: "latitude",
              title: "Latitude",
              expression: "Round(Geometry($feature).y, 6)"
            },
            {
              name: "longitude",
              title: "Longitude",
              expression: "Round(Geometry($feature).x, 6)"
            }
          ]
        }
      });
    
      map.add(eagleLayer);
    
      // Configure the Search widget
      const search = new Search({
        view: view,
        container: "searchBar",
        sources: [
          {
            layer: eagleLayer,
            searchFields: ["Title"],
            displayField: "Title",
            exactMatch: false,
            outFields: ["*"],
            name: "Eagle Sightings",
            placeholder: "Search for eagle sightings by title",
            suggestionTemplate: "{Title}",
            maxResults: 6,
            maxSuggestions: 6,
            suggestionsEnabled: true,
            minSuggestCharacters: 1,
            popupEnabled: false
          }
        ]
      });
    
      // Handle search results
      search.on("select-result", function(event) {
        if (event.result && event.result.feature) {
          const feature = event.result.feature;
          view.goTo({
            target: feature.geometry,
            zoom: 15
          }, {
            duration: 1000
          }).then(function() {
            // Open the popup at the feature's location
            view.popup.open({
              features: [feature],
              location: feature.geometry
            });
          });
        } else {
          alert("No matching eagle sightings found.");
        }
      });
    
      search.on("search-complete", function(event) {
        if (event.numResults === 0) {
          alert("No matching eagle sightings found.");
        }
      });
    
      document.getElementById("addEagleBtn").addEventListener("click", addEagle);
    
      // Add settings button functionality
      const settingsBtn = document.getElementById("settingsBtn");
      settingsBtn.addEventListener("click", toggleSettingsMenu);
    
      let settingsMenu = null;

      
    function toggleSettingsMenu() {
        if (settingsMenu) {
            document.body.removeChild(settingsMenu);
            settingsMenu = null;
        } else {
            settingsMenu = document.createElement("div");
            settingsMenu.id = "settingsMenu";
            settingsMenu.style.position = "absolute";
            settingsMenu.style.top = "60px";
            settingsMenu.style.left = "10px";
            settingsMenu.style.backgroundColor = "white";
            settingsMenu.style.padding = "10px";
            settingsMenu.style.borderRadius = "5px";
            settingsMenu.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
            settingsMenu.style.zIndex = "100";

            const basemapOptions = [
                { id: "topo-vector", name: "Topographic" },
                { id: "satellite", name: "Satellite" },
                { id: "streets-vector", name: "Streets" }
            ];

            basemapOptions.forEach(option => {
                const basemapButton = document.createElement("button");
                basemapButton.textContent = `Switch to ${option.name}`;
                basemapButton.style.display = "block";
                basemapButton.style.width = "100%";
                basemapButton.style.padding = "5px";
                basemapButton.style.marginBottom = "5px";
                basemapButton.addEventListener("click", () => changeBasemap(option.id));
                settingsMenu.appendChild(basemapButton);
            });

            document.body.appendChild(settingsMenu);
        }
    }

    function changeBasemap(basemapId) {
        map.basemap = Basemap.fromId(basemapId);
        updateBasemapButtons();
    }

    function updateBasemapButtons() {
        const buttons = settingsMenu.querySelectorAll("button");
        buttons.forEach(button => {
            const basemapName = button.textContent.replace("Switch to ", "");
            button.disabled = map.basemap.title === basemapName;
        });
    }

    function addEagle() {
        const point = {
            type: "point",
            longitude: view.center.longitude,
            latitude: view.center.latitude
        };

        // Prompt user for title and notes
        const title = prompt("Enter a title for this eagle sighting:");
        if (title === null) {
            return; // User cancelled the prompt
        }

        const notes = prompt("Enter notes for this eagle sighting:");
        if (notes === null) {
            return; // User cancelled the prompt
        }

        const attributes = {
            Title: title,
            Notes: notes,
            Latitude: view.center.latitude,
            Longitude: view.center.longitude
        };

        console.log("Attributes being added:", attributes);

        const graphic = new Graphic({
            geometry: point,
            attributes: attributes
        });

        // Add the feature to the layer
        eagleLayer.applyEdits({
            addFeatures: [graphic]
        }).then(function(result) {
            if (result.addFeatureResults.length > 0) {
                console.log("Successfully added feature");
                view.popup.open({
                    title: title,
                    content: `Notes: ${notes}<br>Latitude: ${view.center.latitude}<br>Longitude: ${view.center.longitude}`,
                    location: point
                });
            }
        }).catch(function(error) {
            console.error("Error adding feature: ", error);
        });
    }

    function editEagle(graphic) {
        const newTitle = prompt("Edit the title for this eagle sighting:", graphic.attributes.Title);
        if (newTitle === null) {
            return; // User cancelled the prompt
        }

        const newNotes = prompt("Edit notes for this eagle sighting:", graphic.attributes.Notes);
        if (newNotes === null) {
            return; // User cancelled the prompt
        }

        const updatedFeature = {
            attributes: {
                OBJECTID: graphic.attributes.OBJECTID,
                Title: newTitle,
                Notes: newNotes,
                Latitude: graphic.attributes.Latitude,
                Longitude: graphic.attributes.Longitude
            },
            geometry: graphic.geometry
        };

        eagleLayer.applyEdits({
            updateFeatures: [updatedFeature]
        }).then(function(result) {
            if (result.updateFeatureResults.length > 0) {
                console.log("Successfully updated feature");
                view.popup.title = newTitle;
                view.popup.content = `Notes: ${newNotes}<br>Latitude: ${graphic.attributes.Latitude}<br>Longitude: ${graphic.attributes.Longitude}`;
                // Refresh the layer to show updated data
                eagleLayer.refresh();
            }
        }).catch(function(error) {
            console.error("Error updating feature: ", error);
        });
    }

    function deleteEagle(graphic) {
        if (confirm("Are you sure you want to delete this eagle sighting?")) {
            eagleLayer.applyEdits({
                deleteFeatures: [{ objectId: graphic.attributes.OBJECTID }]
            }).then(function(result) {
                if (result.deleteFeatureResults.length > 0) {
                    console.log("Successfully deleted feature");
                    view.popup.close();
                    // Refresh the layer to show updated data
                    eagleLayer.refresh();
                }
            }).catch(function(error) {
                console.error("Error deleting feature: ", error);
            });
        }
    }

    // Request user's location and zoom to it
    function requestLocationAndZoom() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(zoomToLocation, locationError);
        } else {
            console.log("Geolocation is not supported by this browser.");
        }
    }

    function zoomToLocation(position) {
        const userLocation = new Point({
            longitude: position.coords.longitude,
            latitude: position.coords.latitude
        });

        view.goTo({
            target: userLocation,
            zoom: 12
        });
    }

    function locationError(error) {
        console.log("Error: ", error);
    }

    // Call the function to request location when the app loads
    requestLocationAndZoom();

    // Add crosshair to the center of the map
    view.when(() => {
        const crosshairGraphic = new Graphic({
            symbol: {
                type: "simple-marker",
                style: "cross",
                size: 16,
                color: "white",
                outline: {
                    color: [50, 205, 50, 0.8],
                    width: 2
                }
            }
        });

        view.graphics.add(crosshairGraphic);

        view.watch("center", (center) => {
            crosshairGraphic.geometry = center;
        });
    });
});
