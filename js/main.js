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
                dataSet.targetFilterList));

            
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
        const analysisMode = String($('#analysis-selector').find('option:selected').val());
        chartList.forEach(chart => {
            chart.chartMode = chartMode;
            chart.viewMode = viewMode;
            chart.analysisMode = analysisMode;
            chart.wordCountThreshold = parseInt($('#word-count-min-num').val());
            chart.rankThreshold = parseInt($('#word-rank-min-num').val());
            chart.draw();
        });
    }

    function convertDataStructure(dataSet) {
        const analysisMode = String($('#analysis-selector').find('option:selected').val());
        const viewMode = String($('#view-selector').find('option:selected').val());
        const chartMode = String($('#chart-selector').find('option:selected').val());
        const base = String($('#base-selector').find('option:selected').val());

        if (analysisMode === 'integration') {
            chartList = [];
            let chart = new Chart(
                dataSet.data,
                dataSet.countMax,
                '',
                dataSet.shrineList,
                dataSet.shrineFilterList,
                dataSet.targetList,
                dataSet.targetFilterList)
            
            chartList.push(chart);
        }
        // else if (analysisMode === 'comp-st') {
        //     chartList = [];

        //     if (viewMode === 'superpose' && chartMode !== 'wordcloud') {
        //         // 寺社別の積み上げ
        //         let chart = new Chart(
        //             dataSet.data,
        //             dataSet.countMax,
        //             '',
        //             dataSet.shrineList,
        //             dataSet.shrineFilterList,
        //             dataSet.targetList,
        //             dataSet.targetFilterList)
        //         chart.wordCountThreshold = (parseInt($('#word-count-min').val()));
        //         chart.compElemList = chart.shrineList;
        //         chartList.push(chart);
        //     }
        //     else {
        //         // 寺社別の複数ビュー
        //         dataSet.shrineList.forEach(shrine => {
        //             let shrineFilterList = {};
        //             shrineFilterList[shrine] = true;
        //             let chart = new Chart(
        //                 dataSet.data,
        //                 dataSet.countMax,
        //                 '#' + shrine,
        //                 [shrine],
        //                 shrineFilterList,
        //                 dataSet.targetList,
        //                 dataSet.targetFilterList)
        //             chart.wordCountThreshold = (parseInt($('#word-count-min').val()));
        //             chartList.push(chart);
        //         });
        //     }
        // }
        // else if (analysisMode === 'comp-target') {
        //     chartList = [];

        //     if (viewMode === 'superpose' && chartMode !== 'wordcloud') {
        //         let chart = new Chart(
        //             dataSet.data,
        //             dataSet.countMax,
        //             '',
        //             dataSet.shrineList,
        //             dataSet.shrineFilterList,
        //             dataSet.targetList,
        //             dataSet.targetFilterList)
        //         chart.wordCountThreshold = (parseInt($('#word-count-min').val()));
        //         chart.compElemList = chart.targetList;
        //         chartList.push(chart);
        //     }
        //     else {
        //         let targetListJa = ['自分', '他者'];
        //         dataSet.targetList.forEach((target, i) => {
        //             let targetFilterList = {};
        //             targetFilterList[target] = true;
        //             let chart = new Chart(
        //                 dataSet.data,
        //                 dataSet.countMax,
        //                 targetListJa[i],
        //                 dataSet.shrineList,
        //                 dataSet.shrineFilterList,
        //                 dataSet.targetList,
        //                 targetFilterList);
        //             chart.wordCountThreshold = (parseInt($('#word-count-min').val()));
        //             chartList.push(chart);
        //         });
        //     }
        // }
        else if (analysisMode === 'comparision') {
            chartList = [];

            if (viewMode === 'juxta-st') {
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
                        dataSet.targetFilterList)
                    
                    chart.compElemList = dataSet.targetList;
                    chartList.push(chart);
                });
            }
            else if (viewMode === 'juxta-target') {
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
                        targetFilterList);
                    
                    chart.compElemList = chart.shrineList;
                    chartList.push(chart);
                });
            }
            else if (viewMode === 'juxta-all') {
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
                            targetFilterList)
                        
                        chartList.push(chart);
                    });
                });
            }
        }
    }

    function initEventLister(dataSet) {
        // イベントリスナ
        const visibleLayoutSelector = () => {
            let anaMode = String($('#analysis-selector').find('option:selected').val());

            if (anaMode.indexOf('comp') === 0) {
                $('#view-selector').show();
            } else {
                $('#view-selector').hide();
            }
        }

        $('#chart-selector').on('input', function () {
            visibleLayoutSelector();
            drawChart();
        });

        $('#analysis-selector').on('input', function () {
            visibleLayoutSelector();
            convertDataStructure(dataSet);
            drawChart();
        });

        $('#view-selector').on('input', function () {
            convertDataStructure(dataSet);
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

        $('#self').on('input', function () {
            chartList.forEach(chart => chart.targetFiltering('self', $(this).prop('checked')));
            drawChart();
        });
        $('#others').on('input', function () {
            chartList.forEach(chart => chart.targetFiltering('other', $(this).prop('checked')));
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
