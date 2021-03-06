
function IBS_Event(args) {
    this.init(args)
}
(function ($) {

    function hex(x) {
        var hexDigits = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f");
        return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
    }
    function rgb2hex(color) {
        var rgb = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (rgb) {
            return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
        } else {
            return color;
        }
    }
    IBS_Event.prototype.init = function (args) {
        $.datepicker.parseDate = function (format, value) {
            return moment(value, format).toDate();
        };
        $.datepicker.formatDate = function (format, value) {
            return moment(value).format(format);
        };
        $('.ibs-datepicker').datepicker(
                {
                    dateFormat: args['titleFormat']
                });

        $('.ibs-timepicker').timepicker(
                {
                    timeFormat: args['timeFormat'],
                    step: 15
                });


        $('.event-allday').prop('disabled', $('#ibs-event-allday').is(':checked'));
        var fd = parseInt(args['firstDay']);
        $('#repeat-wkst').val(fd - 1 === -1 ? 6 : fd - 1);
        var getFormValues = function () {
            var paramObj = {};
            paramObj.freq = $('input[name=freq]:checked').val();
            paramObj.interval = $("#repeat-interval").val();
            var work = [];
            $('input[name=byweekday]').each(function (index, item) {
                if ($(this).is(':checked')) {
                    work.push($(this).val());
                }
            });
            paramObj.byweekday = work; //.toString();
            paramObj.dtstart = $("#repeat-dtstart").val();
            paramObj.count = $("#repeat-count").val();
            paramObj.until = $("#repeat-until").val();
            paramObj.wkst = $('#repeat-wkst').val();
            work = [];
            $('input[name=bymonth]').each(function (index, item) {
                if ($(this).is(':checked')) {
                    work.push($(this).val());
                }
            });
            paramObj.bymonth = work; //.toString();
            paramObj.bysetpos = $("#repeat-bysetpos").val();
            paramObj.bymonthday = $("#repeat-bymonthday").val();
            paramObj.byyearday = $("#repeat-byyearday").val();
            paramObj.byweekno = $("#repeat-byweekno").val();
            paramObj.byhour = $("#repeat-byhour").val();
            paramObj.byminute = $("#repeat-byminute").val();
            paramObj.bysecond = $("#repeat-bysecond").val();
            paramObj.easter = '';
            return paramObj;
        }
        var processChange = function () {
            if ($('#ibs-event-recurr').is(':checked')) {
                var date, days, getDay, makeRule, options, rfc, rule, v, value, values;
                values = getFormValues();
                delete values['radio_ends'];
                options = {};
                days = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU];
                getDay = function (i) {
                    return days[i];
                };
                for (key in values) {
                    value = values[key];
                    if (!value) {
                        continue;
                    } else if (key === 'dtstart' || key === 'until') {
                        date = new Date(Date.parse(value));
                        value = new Date(date.getTime() + (date.getTimezoneOffset() * 60 * 1000));
                    } else if (key === 'byweekday') {
                        if (value instanceof Array) {
                            value = value.map(getDay);
                        } else {
                            value = getDay(value);
                        }
                    } else if (/^by/.test(key)) {
                        if (false === value instanceof Array) {
                            value = value.split(/[,\s]+/);
                        }
                        value = (function () {
                            var _i, _len, _results;
                            _results = [];
                            for (_i = 0, _len = value.length; _i < _len; _i++) {
                                v = value[_i];
                                if (v) {
                                    _results.push(v);
                                }
                            }
                            return _results;
                        })();
                        value = value.map(function (n) {
                            return parseInt(n, 10);
                        });
                    } else {
                        value = parseInt(value, 10);
                    }
                    if (key === 'wkst') {
                        value = getDay(value);
                    }
                    if (key === 'interval' && (value === 1 || !value)) {
                        continue;
                    }
                    options[key] = value;
                }
                makeRule = function () {
                    return new RRule(options);
                };
                try {
                    rule = makeRule();
                } catch (e) {
                    console.log(e)
                    return;
                }
                rfc = rule.toString();
                $("#ibs-event-repeat").val(rfc);
                $("#ibs-event-repeat-display").val(rfc);
            }
            return '';
        };
        $('#repeat-options').on('change', 'input', function () {
            var a = $('input[name=interval]').val() > 1 ? 's' : '';
            switch ($('input[name=freq]:checked').val()) {
                case '3' :
                    $('#repeat-interval-type').text('day' + a);
                    break;
                case '2' :
                    $('#repeat-interval-type').text('week' + a);
                    break;
                case '1' :
                    $('#repeat-interval-type').text('month' + a);
                    break;
                case '0' :
                    $('#repeat-interval-type').text('year' + a);
                    break;
            }
            processChange();
        });
        $('input[name=radio_ends]').click(function (event) {
            switch ($(this).val()) {
                case 'never':
                    $('input[name=until]').val('').attr('disabled', true);
                    $('input[name=count]').val('').attr('disabled', true);
                    break;
                case 'until' :
                    $('input[name=until]').val('').attr('disabled', false);
                    $('input[name=count]').val('').attr('disabled', true);
                    $('#repeat-until').datepicker('setDate', moment().toDate());
                    break;
                case 'count':
                    $('input[name=until]').val('').attr('disabled', true);
                    $('input[name=count]').val('30').attr('disabled', false);
                    break;
            }
            processChange(this, 'options');
        });
        $('#repeat-advanced').click(function (event) {
            $(this).is(':checked') ? $('.repeat-advanced').show() : $('.repeat-advanced').hide();
        });
        $("#ibs-event-recurr").click(function (event) {
            if ($(this).is(':checked')) {
                $('.repeat-option').removeClass('repeat-not-active').find('input').prop('disabled', false);
                $('#repeat-until').prop('disabled', true);
                $('#repeat-dtstart').datepicker('setDate', moment().toDate());
                processChange();
            } else {
                $('#ibs-event-repeat').val('');
                $('#ibs-event-repeat-display').val('');
                $('.repeat-option').addClass('repeat-not-active').find('input').prop('disabled', true);
            }
        });
        $('#repeat-until').datepicker({dateFormat: args['titleFormat']});
        $('#repeat-dtstart').datepicker({dateFormat: args['titleFormat']});
        $("#repeat-advanced").click(function (event) {
            $(this).is(':checked') ? $('.repeat-advanced').show() : $('.repeat-advanced').hide();
        });

        $('.color-box').click(function () {
            $('.color-box').removeClass('color-box-selected');
            $(this).addClass('color-box-selected');
            $('#ibs-event-color').val(rgb2hex($(this).css('background-color')));
        });
        $('.color-box').each(function (index, item) {
            if (rgb2hex($(item).css('background-color')) === $('#ibs-event-color').val()) {
                $(item).trigger('click');
            }
        });
        resetPickers = function () {
            var ts = parseInt($('#ibs-event-start').val());
            if (ts === 0)
                ts = moment().startOf('day').unix();
            var d = moment.unix(ts).toDate();
            $('#ibs-event-start-date').datepicker('setDate', d);
            $('#ibs-event-start-time').timepicker('setTime', d);
            ts = parseInt($('#ibs-event-end').val());
            if (ts === 0)
                ts = moment().endOf('day').unix();
            d = moment.unix(ts).toDate();
            $('#ibs-event-end-date').datepicker('setDate', d);
            $('#ibs-event-end-time').timepicker('setTime', d);
        }
        resetPickers();

        $('#ibs-event-allday').click(function () {
            $('.ibs-datepicker').trigger('change');
        });

        $('.ibs-datepicker, .ibs-timepicker').on('change', '', {}, function () {
            var sdate = moment($('#ibs-event-start-date').datepicker('getDate')).startOf('day');
            var stime = $('#ibs-event-start-time').timepicker('getSecondsFromMidnight');

            var edate = moment($('#ibs-event-end-date').datepicker('getDate')).startOf('day');
            var etime = $('#ibs-event-end-time').timepicker('getSecondsFromMidnight');

            if ($('#ibs-event-allday').is(':checked')) {
                sdate = sdate.startOf('day');
                edate = moment(sdate).endOf('day');
            } else {
                if (edate.diff(sdate) < 0) {
                    edate = moment(sdate.format());
                }
                if (stime > etime) {
                    etime = stime;
                }
                sdate = sdate.add(stime, 'seconds');
                edate = edate.add(etime, 'seconds');
            }
            $('#ibs-event-start-date').datepicker('setDate', sdate.toDate());
            $('#ibs-event-start-time').timepicker('setTime', sdate.toDate());

            $('#ibs-event-end-date').datepicker('setDate', edate.toDate());
            $('#ibs-event-end-time').timepicker('setTime', edate.toDate());

            $('#ibs-event-start').val(sdate.unix());
            $('#ibs-event-end').val(edate.unix());
            
            if ($('#ibs-event-allday').is(':checked')) {
                $('.event-allday').attr('disabled', true);
            } else {
                $('.event-allday').attr('disabled', false);
            }
        });
        if ($('#ibs-event-recurr').is(':checked')) {
            var rule = new RRule(RRule.parseString($('#ibs-event-repeat').val()));
            var options = rule.origOptions;
            for (var i in options) {
                switch (i) {
                    case 'byweekday' :
                        $('input[name=byweekday]').each(function (i, item) {
                            var wd = parseInt($(this).val());
                            for (j in options['byweekday']) {
                                if (options['byweekday'][j].weekday === wd) {
                                    $(this).attr('checked', true);
                                }
                            }
                        });
                        break;
                    case 'dtstart' :
                        $('#repeat-dtstart').datepicker('setDate', options['dtstart']);
                        break;
                    case 'until' :
                        $('#repeat-until').datepicker('setDate', options['until']);
                        $('#repeat-until').attr('disabled', false);
                        $('input[name=radio_ends]').each(function (i, item) {
                            if ($(this).val() === 'until') {
                                $(this).attr('checked', true);
                            } else {
                                $(this).attr('checked', false);
                            }
                        });
                        break;
                    case 'count' :
                        $('#repeat-until').datepicker('setDate', options['until']);
                        $('input[name=radio_ends]').each(function (i, item) {
                            if ($(this).val() === 'until') {
                                $(this).attr('checked', true);
                            } else {
                                $(this).attr('checked', false);
                            }
                        });
                        break;
                    case 'freq':
                        $('input[name=freq]').each(function (i, item) {
                            if ($(this).val() === options['freq'].toString()) {
                                $(this).attr('checked', true);
                            } else {
                                $(this).attr('checked', false);
                            }
                        });
                }
            }

        } else {

        }
    };
})(jQuery);