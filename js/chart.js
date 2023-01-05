class Chart {
    shrineList = [];
    shrineFilterList = {};
    targetList = [];
    targetFilterList = {};
    wordCountThreshold = 1;
    rankThreshold = -1;
    wordListSet = {};
    countMax = 0;
    label = '';

    chartMode = 'wordcloud';
    viewMode = 'juxtapose';
    analysisMode = 'integration';
    compElemList = [];

    constructor(data, max, _label, _shrineList, _shrineFilterList, _targetList, _targetFilterList) {
        this.shrineList = _shrineList;
        this.countMax = max;
        this.shrineFilterList = _shrineFilterList;
        this.targetList = _targetList;
        this.targetFilterList = _targetFilterList;
        this.wordListSet = data;
        this.label = _label;
    }

    shrineFiltering(shrine, flag) {
        if (Object.keys(this.shrineFilterList).includes(shrine)) {
            this.shrineFilterList[shrine] = flag;
        }
    }

    targetFiltering(target, flag) {
        if (Object.keys(this.targetFilterList).includes(target)) {
            this.targetFilterList[target] = flag;
        }
    }

    wordCount(wordList) {
        let csvWordCountList = [];
        wordList.forEach(word => {
            if (word && word != '') {
                if (!csvWordCountList[word]) { // 未出なら1で初期化   
                    csvWordCountList[word] = 1;
                } else { // 既出ならインクリメント
                    csvWordCountList[word] += 1;
                }
            }
        });

        let data = new Array();
        Object.keys(csvWordCountList).map(word => {
            let count = csvWordCountList[word];
            data.push({ text: word, count: count });
        });
        return data;
    }

    draw() {
        let wordList = [];
        this.shrineList.forEach(shrine => {
            if (this.shrineFilterList[shrine]) {
                this.targetList.forEach(target => {
                    if (this.targetFilterList[target]) {
                        wordList = wordList.concat(this.wordListSet[shrine][target]);
                    }
                });
            }
        });

        let data = this.wordCount(wordList);
        data = data.sort((a, b) => (a.count > b.count) ? -1 : 1);
        if (0 < this.rankThreshold && this.rankThreshold < data.length) {
            data = data.slice(0, this.rankThreshold);
        }
        if (this.wordCountThreshold > 0) {
            data = data.filter(d => d.count >= this.wordCountThreshold);
        }

        $('.tooltip').remove();
        if (this.chartMode === 'wordcloud') {
            this.drawWordCloud(data);
        }
        else if (this.chartMode === 'bar') {
            if ((this.viewMode === 'juxta-target' || this.viewMode === 'juxta-st')
                && this.analysisMode.indexOf('comp') === 0) {
                let groupList = data.map(d => d.text)

                let subGroupList = this.compElemList.filter(subGroup => this.shrineFilterList[subGroup] || this.targetFilterList[subGroup]);

                let data1 = [];
                groupList.forEach(group => {
                    let d = { group: group };
                    subGroupList.forEach(subGroup => {
                        d[subGroup] = 0;
                    });
                    data1.push(d);
                });

                this.shrineList.forEach(shrine => {
                    if (this.shrineFilterList[shrine]) {
                        this.targetList.forEach(target => {
                            if (this.targetFilterList[target]) {
                                this.wordListSet[shrine][target].forEach(word => {
                                    data1.forEach(d => {
                                        if (d.group === word) {
                                            if (subGroupList.includes(shrine)) {
                                                d[shrine]++;
                                            }
                                            else if (subGroupList.includes(target)) {
                                                d[target]++;
                                            }
                                        }
                                    });
                                });
                            }
                        });
                    }
                });
                const stackedData = d3.stack().keys(subGroupList)(data1);
                this.drawStackedBarChart(stackedData, groupList, subGroupList);
            }
            else {
                this.drawBarChart(data);
            }
        }
    }


    drawWordCloud(data) {
        const margin = { top: 0, right: 0, bottom: 0, left: 0 };
        if (data.length > 0) {
            let width = Math.log(data.length) * 100;
            let height = Math.log(data.length) * 100;
            let labelH = 30;

            // svgの生成
            const view = d3.select("#main").append("div").attr("class", "view");
            const svg = view.append("svg")
                .attr("width", width - margin.left - margin.right)
                .attr("height", height - margin.top - margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            let paddingScale = d3.scaleLinear().domain([1, this.countMax]).range([1, 8]);
            let fontSizeScale = (count) => Math.sqrt(count) * 10;

            //　レイアウト
            let layout = d3.layout.cloud()
                .size([width, height])
                .words(data)
                .rotate(() => 0)
                .fontSize((d) => fontSizeScale(d.count)) //単語の出現回数を文字サイズに反映
                .padding((d) => paddingScale(d.count))
                .spiral("archimedean")
                .on("end", draw);
            // 描画する
            layout.start();


            svg.append('text')
                .text(this.label)
                .attr("x", width / 2)
                .attr("y", labelH - 10)
                .attr("fill", "#4f4f4f")
                .attr("font-size", "12px");

            // 描画規則の決定
            function draw(words) {
                svg.append("g")
                    .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
                    .selectAll("text")
                    .data(words)
                    .enter()
                    .append("text")
                    .style("font-size", (d) => d.size)
                    .attr("text-anchor", "middle")
                    .style("font-family", "san-serif")
                    .style("font-weight", "bold")
                    .style("fill", "#4f4f4f")
                    .attr("name", d => d.text)
                    .attr("transform", (d) => "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")")
                    .attr('class', 'vis-var')
                    .text((d) => d.text);
            }
        }
    }

    drawBarChart(data) {
        const margin = { top: 30, right: 0, bottom: 50, left: 100 };
        if (data.length > 0) {
            let width = Math.log(this.countMax) * 50;
            let height = data.length * 15

            let tooltip = d3.select("body").append("div").attr("class", "tooltip");
            const view = d3.select("#main").append("div").attr("class", "view");
            const svg = view.append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            // Add X axis
            const x = d3.scaleLinear()
                .domain([0, this.countMax])
                .range([0, width]);
            svg.append("g")
                .attr("transform", `translate(0, ${margin.top - 5})`)
                .call(d3.axisTop(x))
                .selectAll("text")
                .attr("transform", "translate(0,0)")
                .attr('fill', '#4f4f4f')
                .style("text-anchor", "end");

            // Y axis
            const y = d3.scaleBand()
                .range([0, height])
                .domain(data.map(d => d.text))
                .padding(0.1);
            svg.append("g")
                .attr("transform", `translate(-5, ${margin.top})`)
                .call(d3.axisLeft(y).tickSize(0))
                .attr('font-size', '10px');

            //Bars
            svg.append("g")
                .selectAll("g")
                .data(data)
                .join("rect")
                .attr("transform", `translate(0, ${margin.top})`)
                .attr("x", x(0))
                .attr("y", d => y(d.text))
                .attr("width", d => x(d.count))
                .attr("height", y.bandwidth())
                .attr("fill", "#4f4f4f")
                .attr('name', d => d.text)
                .attr('class', 'vis-var')
                .on('mouseover', function (d, i) {
                    tooltip
                        .text(d.count)
                        .style("top", (d3.event.pageY - 20) + "px")
                        .style("left", (d3.event.pageX + 10) + "px")
                        .style("visibility", "visible");
                })
                .on('mouseout', function (d, i) {
                    tooltip.style("visibility", "visible");
                });

            svg.append('text')
                .text(this.label)
                .attr("x", -margin.top)
                .attr("y", 0)
                .attr("fill", "#4f4f4f")
                .attr("font-size", "12px");
        }
    }

    drawStackedBarChart(data, groupList, subGroupList) {
        const margin = { top: 30, right: 100, bottom: 50, left: 100 };
        if (data.length > 0) {
            let width = Math.log(this.countMax) * 50;
            let height = groupList.length * 15

            let tooltip = d3.select("body").append("div").attr("class", "tooltip");
            const view = d3.select("#main").append("div").attr("class", "view");
            const svg = view.append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


            // Add X axis
            const x = d3.scaleLinear()
                .domain([0, this.countMax])
                .range([0, width]);
            svg.append("g")
                .attr("transform", `translate(0, ${margin.top - 5})`)
                .call(d3.axisTop(x))
                .selectAll("text")
                .attr("transform", "translate(0,0)")
                .attr('fill', '#4f4f4f')
                .style("text-anchor", "end");

            // Y axis
            const y = d3.scaleBand()
                .range([0, height])
                .domain(groupList)
                .padding(0.1);
            svg.append("g")
                .attr("transform", `translate(-5, ${margin.top})`)
                .call(d3.axisLeft(y).tickSize(0))
                .attr('font-size', '10px');;


            const colorSet = this.compElemList.map((sg, i) => {
                let h = i / this.compElemList.length * 360;
                let s = 0.5;
                let v = 0.9;
                return chroma.hsv(h, s, v).css();
            });
            const color = d3.scaleOrdinal()
                .domain(this.compElemList)
                .range(colorSet)

            svg.append("g")
                .selectAll("g")
                .data(data)
                .join("g")
                .attr("transform", `translate(0, ${margin.top})`)
                .attr("fill", d => color(d.key))
                .selectAll("rect")
                .data(d => d)
                .join("rect")
                .attr("y", d => y(d.data.group))
                .attr("x", d => x(d[0]))
                .attr("width", d => x(d[1] - d[0]))
                .attr("name", d => d.data.group)
                .attr('class', 'vis-var')
                .attr("height", y.bandwidth());


            let legend = {
                margin: 20,
                padding: 5,
                size: 10
            };
            svg.append("g")
                .selectAll("g")
                .data(subGroupList)
                .join("rect")
                .attr("transform", `translate(${width + legend.margin}, 10)`)
                .attr("x", 0)
                .attr("y", (d, i) => i * (legend.size + legend.padding))
                .attr("width", legend.size)
                .attr("height", legend.size)
                .attr("fill", d => color(d));

            svg.append("g")
                .selectAll("g")
                .data(subGroupList)
                .join('text')
                .attr("transform", `translate(${width + legend.margin + legend.padding}, 10)`)
                .attr("x", 10)
                .attr("y", (d, i) => i * (legend.size + legend.padding))
                .attr("font-size", "10px")
                .attr("text-anchor", "start")
                .attr("dominant-baseline", "text-before-edge")
                .text(d => {
                    if(d === 'self') {
                        return '自分';
                    } else if(d === 'other') {
                        return '他者';
                    } else {
                        return d;
                    }
                });

            svg.append('text')
                .text(this.label)
                .attr("x", -margin.top)
                .attr("y", 0)
                .attr("fill", "#4f4f4f")
                .attr("font-size", "12px");
        }
    }
}


