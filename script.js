require([
    "esri/config",
    "esri/Map",
    "esri/views/MapView",
    "esri/widgets/Search",
    "esri/Graphic",
    "esri/layers/FeatureLayer",
    "esri/geometry/Point",
    "esri/widgets/Popup",
    "esri/rest/support/FeatureSet"
], function(esriConfig, Map, MapView, Search, Graphic, FeatureLayer, Point, Popup, FeatureSet) {

    // Midterm_API key
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

    // Define the feature layer for eagle sightings
    // Replace the URL below with your actual Feature Layer URL
    const eagleLayer = new FeatureLayer({
        url: "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/Midterm_Layer/FeatureServer",
        outFields: ["*"],
        popupTemplate: {
            title: "Eagle Sighting",
            content: [{
                type: "fields",
                fieldInfos: [{
                    fieldName: "notes",
                    label: "Notes"
                }]
            }]
        }
    });

    map.add(eagleLayer);

    const search = new Search({
        view: view,
        container: "searchBar"
    });

    document.getElementById("addEagleBtn").addEventListener("click", addEagle);

    function addEagle() {
        const point = {
            type: "point",
            longitude: view.center.longitude,
            latitude: view.center.latitude
        };

        // Prompt user for notes
        const notes = prompt("Enter notes for this eagle sighting:");

        const attributes = {
            notes: notes
        };

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
                    title: "Eagle Sighting Added",
                    content: "Notes: " + notes,
                    location: point
                });
            }
        }).catch(function(error) {
            console.error("Error adding feature: ", error);
        });
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