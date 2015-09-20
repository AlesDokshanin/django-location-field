($ || django.jQuery)(function ($) {
    function location_field_load(map, location_based, zoom, suffix) {
        $(location_based).keypress(function (e) {
            if (e.which == 13) {
                return false;
            }
        });

        var parent = map.parent().parent();

        var location_map;

        var location_coordinate = parent.find('input[type=text]');

        function savePosition(point) {
            if (point) {
                location_coordinate.val(point.lat().toFixed(6) + "," + point.lng().toFixed(6));
                location_map.panTo(point);
            }
            else {
                var point = new google.maps.LatLng(1, 1);
                location_map.panTo(point)
            }
        }

        function load() {
            var point = new google.maps.LatLng(1, 1);

            var options = {
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            var autocomplete = new google.maps.places.Autocomplete(location_based[0]);

            location_map = new google.maps.Map(map[0], options);

            autocomplete.addListener('place_changed', function () {
                var place = autocomplete.getPlace();
                if (place.geometry) {
                    if (place.geometry.viewport) {
                        location_map.fitBounds(place.geometry.viewport);
                    }
                    else {
                        location_map.setCenter(place.geometry.location);
                        //location_map.setZoom(17);
                    }

                    placeMarker(place.geometry.location);
                }

            });

            var initial_position;

            if (location_coordinate.val()) {
                var l = location_coordinate.val().split(/,/);

                if (l.length > 1) {
                    initial_position = new google.maps.LatLng(l[0], l[1]);
                }
            }

            var marker = new google.maps.Marker({
                map: location_map,
                position: initial_position,
                draggable: true
            });

            google.maps.event.addListener(marker, 'dragend', function (mouseEvent) {
                savePosition(mouseEvent.latLng);
            });

            google.maps.event.addListener(location_map, 'click', function (mouseEvent) {
                marker.setPosition(mouseEvent.latLng);
                savePosition(mouseEvent.latLng);
            });

            var no_change = false;

            location_based.each(function (i, f) {
                f = $(this);
                f.on('click', function (event) {
                    f.val('');
                });
            });


            // Prevents querying Google Maps everytime field changes
            var location_coordinate_delay;

            location_coordinate.keyup(function () {
                //if (no_change) return;
                var latlng = $(this).val().split(/,/);
                if (latlng.length < 2) return;
                clearTimeout(location_coordinate_delay);
                location_coordinate_delay = setTimeout(function () {
                    var ll = new google.maps.LatLng(latlng[0], latlng[1]);
                    location_map.panTo(ll);
                    marker.setPosition(ll);
                }, 100);
            });

            function placeMarker(location) {
                location_map.setZoom(zoom);
                marker.setPosition(location);
                location_map.setCenter(location);
                savePosition(location);
            }

            placeMarker(initial_position);
        }

        load();
    }


    $('input[data-location-widget]').livequery(function () {
        var $el = $(this), name = $el.attr('name'), pfx;

        try {
            pfx = name.match(/-(\d+)-/)[1];
        } catch (e) {
        }
        ;

        var values = {
            map: $el.attr('data-map'),
            zoom: $el.attr('data-zoom'),
            suffix: $el.attr('data-suffix'),
            based_fields: $el.attr('data-based-fields')
        }

        if (!/__prefix__/.test(name)) {
            for (key in values) {
                if (/__prefix__/.test(values[key])) {
                    values[key] = values[key].replace(/__prefix__/g, pfx);
                }
            }
        }

        var $map = $(values.map),
            $based_fields = $(values.based_fields),
            zoom = parseInt(values.zoom),
            suffix = values.suffix;

        location_field_load($map, $based_fields, zoom, suffix);
    });
});