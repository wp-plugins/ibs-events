/*
 Author URI: http://indianbendsolutions.com
 License: GPL
 
 GPL License: http://www.opensource.org/licenses/gpl-license.php
 
 This program is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */
function IBS_LIST_EVENTS($, args, mode) {
    this.init(args, mode)
}
(function ($) {
    IBS_LIST_EVENTS.prototype.init = function (args, mode) {
        var list = this;
        var options = {
            repeats: true,
            dateFormat: 'ddd MMM DD',
            timeFormat: 'h:mm a',
            errorMsg: 'No events in calendar',
            max: 100,
            start: 'now',
            descending: false
        }
        for (arg in args) {
            var data = args[arg];
            if (typeof data === 'string') {
                data = data.toLowerCase();
                if (data === 'yes' || data === 'no') {
                    args[arg] = data === 'yes' ? true : false;
                } else {
                    if (data === 'true' || data === 'false') {
                        args[arg] = data === 'true' ? true : false;
                    }
                }
            }
        }
        list_qtip_params = function (event) {
            var bg = '<p style="background-color:'
                    + event.color
                    + '; color:'
                    + event.textColor
                    + ';" >';
            bg = '<p style="background-color:silver; color: black;" >';
            var loc = '';
            if (typeof event.location !== 'undefined' && event.location !== '') {
                loc = '<p>' + 'Location: ' + event.location + '</p>';
            }
            var desc = '';
            if (typeof event.description !== 'undefined' && event.description !== '') {
                desc = '<p>' + event.description + '</p>'
            }
            var time = moment(event.start).format(options.dateFormat + ' ' + options.timeFormat) + moment(event.end).format(' - ' + options.timeFormat);
            if (event.allDay) {
                time = moment(event.start).format(options.dateFormat) + ' ' + 'All day';
            }
            return {
                content: {'text': '<p>' + event.title + '</p>' + loc + desc + '<p>' + time + '</p>'},
                position: {
                    my: 'bottom center',
                    at: 'top center'
                },
                style: {
                    classes: args['qtip']['style'] + ' ' + args['qtip']['rounded'] + args['qtip']['shadow']

                },
                show: {
                    event: 'mouseover'
                },
                hide: {
                    event: 'mouseout mouseleave'
                }
            };
        }
        var ibs_events = null;
        for (var arg in args) {
            if (typeof options[arg] !== 'undefined' && args[arg] !== '') {
                options[arg] = args[arg];
            }
        }
        if (options.start === 'now') {
            options.start = moment();
        } else {
            options.start = moment(options.start);
        }
        options.end = moment(options.start).add(2, 'year');
        $.get(args.ajaxUrl, {
            action: 'ibs_events_get_events',
            cache: false,
            dataType: 'json'
        }).then(
                function (data) {
                    if (data !== "") {
                        data = decodeURIComponent(data);
                        ibs_events = JSON.parse(data);
                        for (var i in ibs_events) {
                            ibs_events[i].editable = false;
                            ibs_events[i].start = moment.unix(parseInt(ibs_events[i].start));
                            ibs_events[i].end = moment.unix(parseInt(ibs_events[i].end));
                        }
                        console.log("IBS Events loaded.");
                    } else {
                        ibs_events = [];
                    }
                    var result = [];
                    try {
                        for (var ex in ibs_events) {
                            var event = ibs_events[ex];
                            if (false === event.recurr) {
                                if (options.start.diff(event.start) <= 0) {
                                    result.push(event);
                                }
                            } else {
                                if (options.repeats) {
                                    var exceptions = [];
                                    if (event.exceptions) {
                                        exceptions = event.exceptions.split(',');
                                        for (var i in exceptions) {
                                            exceptions[i] = moment(exceptions[i]).startOf('day');
                                        }
                                    }
                                    var rule = new RRule(RRule.parseString(event.repeat));
                                    var to, from;
                                    from = options.start.toDate();
                                    to = options.end.toDate()
                                    var dates = rule.between(from, to);
                                    for (i in dates) {
                                        dates[i] = moment(dates[i]).startOf('day');
                                    }
                                    var isException = function (index) {
                                        for (var i in exceptions) {
                                            if (exceptions[i].diff(dates[index]) === 0) {
                                                return true;
                                            }
                                        }
                                        return false;
                                    };
                                    var duration = moment(event.end).diff(moment(event.start), 'seconds');
                                    var start_time = moment(event.start).unix() - moment(event.start).startOf('day').unix();

                                    for (var i in dates) {
                                        if (isException(i)) {
                                            continue;
                                        }
                                        var theDate = dates[i].startOf('day');
                                        var current = {
                                            start: theDate.add(start_time, 'seconds').format(),
                                            end: theDate.add(duration, 'seconds').format(),
                                            id: event.id,
                                            title: event.title,
                                            allDay: event.allDay,
                                            color: event.color,
                                            textColor: event.textColor,
                                            description: event.description,
                                            url: event.url,
                                            repeat: event.repeat,
                                            exceptions: event.exceptions
                                        };
                                        result.push(current);
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.log(ex + e);
                    }
                    var events = result.sort(function (a, b) {
                        return a.start.unix() - b.start.unix();
                    });
                    if (options.descending) {
                        events = events.reverse();
                    }
                    events = events.slice(0, options.max);
                    if (mode === 'shortcode') {
                        var event_div = '#ibs-list-events-' + args.id;
                        $(event_div).empty().css('cursor', 'pointer');
                        for (var i = 0; i < events.length; i++) {
                            var pattern = args.dateFormat
                            var d = moment(events[i].start).format(pattern);
                            var f = moment(events[i].start).format(args.timeFormat);
                            var t = moment(events[i].end).format(args.timeFormat);
                            $(event_div)
                                    .append($('<div>')
                                            .append($('<div>').addClass('bar')
                                                    .append($('<a>').attr({href: events[i].url, target:'_blank'}).html(events[i].title)))
                                            .append($('<div>').addClass('when-div')
                                                    .append($('<span>').text(d))
                                                    .append($('<span>').text(f))
                                                    .append($('<span>').text('to'))
                                                    .append($('<span>').text(t)))
                                            .append($('<div>').text(events[i].location).addClass('where-div'))
                                            .append($('<div>').css('display', events[i].description === '' ? 'none' : 'block')
                                                    .append($('<div>').html(events[i].description).addClass('textbox')))
                                            );
                        }
                    } else {
                        var event_table = '#ibs-events-' + args.id;
                        for (var i = 0; i < events.length; i++) {
                            var qtp = list_qtip_params(events[i]);
                            $(event_table)
                                    .append($('<div>').qtip(qtp)
                                            .append($('<a>').attr({href: events[i].url, target:'_blank'}).html(events[i].title)));
                        }
                    }

                },
                function () {
                    console.log("Get IBS Events failed.");
                });
    };
}(jQuery));
