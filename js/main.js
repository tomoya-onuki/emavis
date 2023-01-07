$(function () {
    let chartList = [];

    new Data().read('./data/ema_worddata.json')
        .then(dataSet => {
            chartList.push(new Chart(
                dataSet.data,
                dataSet.countMax,
                '',
                dataSet.shrineList,
                dataSet.shrineFilterList,
                dataSet.targetList,
                dataSet.targetFilterList,
                dataSet.areaList,
                dataSet.areaFilterList
            ));


            initEventLister(dataSet);
            drawChart();
            $('#word-count-min-num').attr('max', dataSet.countMax - 1);
            $('#word-count-min-slider').attr('max', dataSet.countMax - 1);

            $('#word-rank-min-num').attr('max', dataSet.wordList.length);
            $('#word-rank-min-slider').attr('max', dataSet.wordList.length);
            $('#word-rank-min-num').val(dataSet.wordList.length);
            $('#word-rank-min-slider').val(dataSet.wordList.length);
        });

    function drawChart() {
        $('.view').remove();
        const chartMode = String($('#chart-selector').find('option:selected').val());
        const viewMode = String($('#view-selector').find('option:selected').val());
        const ratio = Number($('#scale').val()) / 100;
        let maxList = [];
        chartList.forEach(chart => {
            chart.chartMode = chartMode;
            chart.viewMode = viewMode;
            chart.wordCountThreshold = parseInt($('#word-count-min-num').val());
            chart.rankThreshold = parseInt($('#word-rank-min-num').val());
            chart.svgRatio = ratio;
            chart.setup();
            maxList.push(chart.countMax);
        });
        let max = Math.max(...maxList);
        chartList.forEach(chart => {
            chart.countMax = max;
            chart.draw();
        });
    }

    function convertDataStructure(dataSet) {
        const viewMode = String($('#view-selector').find('option:selected').val());
        const chartMode = String($('#chart-selector').find('option:selected').val());
        const base = String($('#base-selector').find('option:selected').val());

        chartList = [];

        if (viewMode === 'integration') {
            let chart = new Chart(
                dataSet.data,
                dataSet.countMax,
                '',
                dataSet.shrineList,
                dataSet.shrineFilterList,
                dataSet.targetList,
                dataSet.targetFilterList,
                dataSet.areaList,
                dataSet.areaFilterList
            );

            chartList.push(chart);
        }
        else if (viewMode === 'norm-shrine') {
            dataSet.shrineList.forEach(shrine => {
                let shrineFilterList = {};
                shrineFilterList[shrine] = true;
                let chart = new Chart(
                    dataSet.data,
                    dataSet.countMax,
                    '#' + shrine,
                    [shrine],
                    shrineFilterList,
                    dataSet.targetList,
                    dataSet.targetFilterList,
                    dataSet.areaList,
                    dataSet.areaFilterList
                );
                chartList.push(chart);
            });
        }
        else if (viewMode === 'norm-target') {
            let targetListJa = ['自分', '他者'];
            dataSet.targetList.forEach((target, i) => {
                let targetFilterList = {};
                targetFilterList[target] = true;
                let chart = new Chart(
                    dataSet.data,
                    dataSet.countMax,
                    targetListJa[i],
                    dataSet.shrineList,
                    dataSet.shrineFilterList,
                    dataSet.targetList,
                    targetFilterList,
                    dataSet.areaList,
                    dataSet.areaFilterList
                );
                chartList.push(chart);
            });
        }
        else if (viewMode === 'norm-area') {
            let areaListJa = ['都心', '地方'];
            dataSet.areaList.forEach((area, i) => {
                let areaFilterList = {};
                areaFilterList[area] = true;
                let chart = new Chart(
                    dataSet.data,
                    dataSet.countMax,
                    areaListJa[i],
                    dataSet.shrineList,
                    dataSet.shrineFilterList,
                    dataSet.targetList,
                    dataSet.targetFilterList,
                    dataSet.areaList,
                    areaFilterList
                );
                chartList.push(chart);
            });
        }
        else if (viewMode === 'key-shrine') {
            // 寺社別の複数ビュー
            dataSet.shrineList.forEach(shrine => {
                let shrineFilterList = {};
                shrineFilterList[shrine] = true;
                let chart = new Chart(
                    dataSet.data,
                    dataSet.countMax,
                    '#' + shrine,
                    [shrine],
                    shrineFilterList,
                    dataSet.targetList,
                    dataSet.targetFilterList,
                    dataSet.areaList,
                    dataSet.areaFilterList
                );

                chart.compElemList = dataSet.targetList;
                chartList.push(chart);
            });
        }
        else if (viewMode === 'key-target') {
            let targetListJa = ['自分', '他者'];
            dataSet.targetList.forEach((target, i) => {
                let targetFilterList = {};
                targetFilterList[target] = true;
                let chart = new Chart(
                    dataSet.data,
                    dataSet.countMax,
                    targetListJa[i],
                    dataSet.shrineList,
                    dataSet.shrineFilterList,
                    dataSet.targetList,
                    targetFilterList,
                    dataSet.areaList,
                    dataSet.areaFilterList
                );

                chart.compElemList = chart.shrineList;
                chartList.push(chart);
            });
        }
        else if (viewMode === 'key-area') {
            let areaListJa = ['都心', '地方'];
            dataSet.areaList.forEach((area, i) => {
                let areaFilterList = {};
                areaFilterList[area] = true;
                let chart = new Chart(
                    dataSet.data,
                    dataSet.countMax,
                    areaListJa[i],
                    dataSet.shrineList,
                    dataSet.shrineFilterList,
                    dataSet.targetList,
                    dataSet.targetFilterList,
                    dataSet.areaList,
                    areaFilterList
                );

                chart.compElemList = dataSet.targetList;
                chartList.push(chart);
            });
        }
        else if (viewMode === 'set-shrine-target') {
            let targetListJa = ['自分', '他者'];
            dataSet.shrineList.forEach(shrine => {
                let shrineFilterList = {};
                shrineFilterList[shrine] = true;

                dataSet.targetList.forEach((target, i) => {
                    let targetFilterList = {};
                    targetFilterList[target] = true;
                    let chart = new Chart(
                        dataSet.data,
                        dataSet.countMax,
                        '#' + shrine + '-' + targetListJa[i],
                        [shrine],
                        shrineFilterList,
                        dataSet.targetList,
                        targetFilterList,
                        dataSet.areaList,
                        dataSet.areaFilterList
                    );
                    chartList.push(chart);
                });
            });
        }
        else if (viewMode === 'set-area-target') {
            let areaListJa = ['都心', '地方'];
            let targetListJa = ['自分', '他者'];
            dataSet.areaList.forEach((area, i) => {
                let areaFilterList = {};
                areaFilterList[area] = true;
                dataSet.targetList.forEach((target, j) => {
                    let targetFilterList = {};
                    targetFilterList[target] = true;
                    let chart = new Chart(
                        dataSet.data,
                        dataSet.countMax,
                        '#' + areaListJa[i] + '-' + targetListJa[j],
                        dataSet.shrineList,
                        dataSet.shrineFilterList,
                        dataSet.targetList,
                        targetFilterList,
                        dataSet.areaList,
                        areaFilterList
                    );
                    chartList.push(chart);
                });
            });
        }
    }

    function initEventLister(dataSet) {
        // イベントリスナ
        $('#chart-selector').on('input', function () {
            drawChart();
        });

        $('#view-selector').on('input', function () {
            convertDataStructure(dataSet);
            drawChart();
        });

        $('#redraw').on('click', function() {
            drawChart();  
        });

        $('#scale').on('input', function() {
            const val = Number($(this).val());
            $(this).next().text(`${val}%`);
        });
        $('#scale').on('change', function() {
            drawChart();
        });

        $('#word-rank-min-slider').on('input', function () {
            if ($(this).val()) {
                let val = parseInt($(this).val());
                $('#word-rank-min-num').val(val);
                chartList.forEach(chart => chart.rankThreshold = val);
                drawChart();
            }
        });
        $('#word-rank-min-num').on('input', function () {
            if ($(this).val()) {
                let val = parseInt($(this).val());
                $('#word-rank-min-slider').val(val);
                chartList.forEach(chart => chart.rankThreshold = val);
                drawChart();
            }
        });


        $('#word-count-min-slider').on('input', function () {
            if ($(this).val()) {
                let val = parseInt($(this).val());
                $('#word-count-min-num').val(val);
                chartList.forEach(chart => chart.wordCountThreshold = val);
                drawChart();
            }
        });
        $('#word-count-min-num').on('input', function () {
            if ($(this).val()) {
                let val = parseInt($(this).val());
                $('#word-count-min-slider').val(val);
                chartList.forEach(chart => chart.wordCountThreshold = val);
                drawChart();
            }
        });


        $('.chbox-shrine').each(function () {
            $(this).on('input', function () {
                chartList.forEach(chart => chart.shrineFiltering($(this).attr('name'), $(this).prop("checked")));
                drawChart();
            });
        });
        $('#shrine-all').on('click', function () {
            $('.chbox-shrine').prop('checked', true);
            chartList.forEach(chart => {
                chart.shrineList.forEach(shrine => {
                    chart.shrineFiltering(shrine, true);
                });
            });
            drawChart();
        });
        $('#shrine-clear').on('click', function () {
            $('.chbox-shrine').prop('checked', false);
            chartList.forEach(chart => {
                chart.shrineList.forEach(shrine => {
                    chart.shrineFiltering(shrine, false);
                });
            });
            drawChart();
        });

        $('#self').on('input', function () {
            chartList.forEach(chart => chart.targetFiltering('self', $(this).prop('checked')));
            drawChart();
        });
        $('#others').on('input', function () {
            chartList.forEach(chart => chart.targetFiltering('other', $(this).prop('checked')));
            drawChart();
        });

        $('#urban').on('input', function () {
            chartList.forEach(chart => chart.areaFiltering('U', $(this).prop('checked')));
            drawChart();
        });
        $('#rural').on('input', function () {
            chartList.forEach(chart => chart.areaFiltering('R', $(this).prop('checked')));
            drawChart();
        });


        $('#highlight-word').on('input', function () {
            $('#highlight').prop('checked', false);
        });
        $('#highlight').on('input', function () {
            const target = String($('#highlight-word').val());
            const flag = $(this).prop('checked');

            d3.select('#main')
                .selectAll('.vis-var')
                .each(function () {
                    if (flag) {
                        const word = d3.select(this).attr('name');
                        const reg = new RegExp(word, "gu");
                        if (reg.exec(target)) {
                            d3.select(this).style('fill-opacity', 1.0);
                        } else {
                            d3.select(this).style('fill-opacity', 0.3);
                        }
                    } else {
                        d3.select(this).style('fill-opacity', 1.0);
                    }
                });
        });

        $('#highlight-reset').on('click', function () {
            d3.select('#main')
                .selectAll('.vis-var')
                .each(function () {
                    d3.select(this).style('fill-opacity', 1.0);
                });
        });

    }
});
