class Chart {
    shrineList = [];
    shrineFilterList = {};
    targetList = [];
    targetFilterList = {};
    areaList = [];
    areaFilterList = {};
    wordCountThreshold = 1;
    rankThreshold = -1;
    wordListSet = {};
    data = [];
    stackedDataSet = { data: [], groupList: [], subGroupList: [] };
    embedDataSet = {};
    countMax = 0;
    label = '';

    chartMode = 'wordcloud';
    viewMode = 'juxtapose';
    compElemList = [];

    svgRatio = 1.0;

    constructor(data, max, _label, _shrineList, _shrineFilterList, _targetList, _targetFilterList, _areaList, _areaFilterList) {
        this.shrineList = _shrineList;
        this.countMax = max;
        this.shrineFilterList = _shrineFilterList;
        this.targetList = _targetList;
        this.targetFilterList = _targetFilterList;
        this.areaList = _areaList;
        this.areaFilterList = _areaFilterList;
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

    areaFiltering(area, flag) {
        if (Object.keys(this.areaFilterList).includes(area)) {
            this.areaFilterList[area] = flag;
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

    filtering() {
        let wordList = [];
        this.shrineList.forEach(shrine => {
            if (this.shrineFilterList[shrine]) {
                this.targetList.forEach(target => {
                    if (this.targetFilterList[target]) {
                        this.areaList.forEach(area => {
                            if (this.areaFilterList[area]
                                && shrine.charAt(shrine.length - 1) === area) {
                                wordList = wordList.concat(this.wordListSet[shrine][target]);
                            }
                        });
                    }
                });
            }
        });
        return wordList;
    }

    stacked() {
        let groupList = this.data.map(d => d.text)

        let subGroupList = this.compElemList.filter(subGroup => this.shrineFilterList[subGroup] || this.targetFilterList[subGroup]);

        let data1 = [];
        groupList.forEach(group => {
            let d = { group: group };
            subGroupList.forEach(subGroup => {
                d[subGroup] = 0;
            });
            data1.push(d);
        });

        // console.log(groupList);
        // console.log(subGroupList);
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
        const stackedData = {
            data: d3.stack().keys(subGroupList)(data1),
            groupList: groupList,
            subGroupList: subGroupList
        };


        let sumList = [];
        stackedData.data.forEach(arr => {
            arr.forEach(d => {
                let sum = 0;
                subGroupList.forEach(key => sum += d.data[key]);
                sumList.push(sum);
            });
        });
        this.countMax = Math.max(...sumList);

        return stackedData;
    }

    embed(groupList) {
        return this.data.map(d => {
            // Init
            let count = {};
            groupList.forEach(group => count[group] = 0);

            this.shrineList.forEach(shrine => {
                if (this.shrineFilterList[shrine]) {
                    this.targetList.forEach(target => {
                        if (this.targetFilterList[target]) {
                            this.wordListSet[shrine][target].forEach(word => {
                                if (word === d.text && groupList.includes(shrine)) {
                                    count[shrine]++;
                                }
                                else if (word === d.text && groupList.includes(target)) {
                                    count[target]++;
                                }
                            });
                        }
                    });
                }
            });
            return {
                word: d.text,
                data: count
            }
        });
    }


    setup() {
        let wordList = this.filtering();
        this.data = this.wordCount(wordList);
        this.data = this.data.sort((a, b) => (a.count > b.count) ? -1 : 1);
        if (0 < this.rankThreshold && this.rankThreshold < this.data.length) {
            this.data = this.data.slice(0, this.rankThreshold);
        }
        if (this.wordCountThreshold > 0) {
            this.data = this.data.filter(d => d.count >= this.wordCountThreshold);
        }

        // for stacked
        if (this.chartMode === 'wordcloud') {
            if (this.viewMode.indexOf('key-') != -1) {
                this.embedDataSet = this.embed(this.compElemList);
                // console.log(this.embedDataSet);
            }
            else {
                this.countMax = Math.max(...(this.data.map(d => d.count)));
            }
        }
        else if (this.chartMode === 'bar') {
            if (this.viewMode.indexOf('key-') != -1) {
                this.stackedData = this.stacked();
            }
            else {
                this.countMax = Math.max(...(this.data.map(d => d.count)));
            }
        }
    }

    draw() {
        $('.tooltip').remove();
        if (this.chartMode === 'wordcloud') {
            if (this.viewMode === 'key-shrine' || this.viewMode === 'key-area') {
                this.drawWordCloudWithPieChart(this.data, this.embedDataSet);
            }
            else if (this.viewMode === 'key-target') {
                this.drawWordCloudWithBarChart(this.data, this.embedDataSet);
            }
            else if (this.viewMode.indexOf('norm-') != -1) {
                this.drawWordCloud(this.data);
            }
            else if (this.viewMode.indexOf('set-') != -1) {
                this.drawWordCloud(this.data);
            }
            else {
                this.drawWordCloud(this.data);
            }
        }
        else if (this.chartMode === 'bar') {
            if (this.viewMode.indexOf('key-') != -1) {
                this.drawStackedBarChart(this.stackedData.data, this.stackedData.groupList, this.stackedData.subGroupList);
            }
            else if (this.viewMode.indexOf('norm-') != -1) {
                this.drawBarChart(this.data);
            }
            else if (this.viewMode.indexOf('set-') != -1) {
                this.drawBarChart(this.data);
            }
            else {
                this.drawBarChart(this.data);
            }
        }
    }


    drawWordCloud(data) {
        const margin = { top: 0, right: 0, bottom: 0, left: 0 };
        if (data.length > 0) {
            const fontSizeScale = (count) => Math.sqrt(count) * 10 * this.svgRatio;

            let size = Math.round(Math.sqrt(data.map(d => fontSizeScale(d.count)).reduce((sum, c) => sum + c)) * 12 * this.svgRatio);
            let width = size;
            let height = size + margin.top;

            // svgの生成
            const view = d3.select("#main").append("div").attr("class", "view");
            const svg = view.append("svg")
                .attr("width", width - margin.left - margin.right)
                .attr("height", height - margin.top - margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            const paddingScale = d3.scaleLinear().domain([1, this.countMax]).range([1, size / 100 * this.svgRatio]);


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
                .attr("y", 0)
                .attr("fill", "#4f4f4f")
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "text-before-edge")
                .attr("font-size", "12px");

            // 描画規則の決定
            function draw(words) {
                svg.append("g")
                    .attr("transform", `translate(${width / 2},${height / 2})`)
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
                    .attr("x", d => d.x)
                    .attr("y", d => d.y)
                    .attr('class', 'vis-var')
                    .text((d) => d.text);
            }
        }
    }
    drawWordCloudWithPieChart(data, pieData) {
        const compElemList = this.compElemList;
        const margin = { top: 30, right: 0, bottom: 0, left: 0 };
        if (data.length > 0) {
            const fontSizeScale = (count) => Math.sqrt(count) * 10 * this.svgRatio;

            let size = Math.round(Math.sqrt(data.map(d => fontSizeScale(d.count)).reduce((sum, c) => sum + c)) * 12 * this.svgRatio);
            let width = size + margin.right;
            let height = size + margin.top;

            // svgの生成
            const view = d3.select("#main").append("div").attr("class", "view");
            const svg = view.append("svg")
                .attr("width", width - margin.left - margin.right)
                .attr("height", height - margin.top - margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            const paddingScale = d3.scaleLinear().domain([1, this.countMax]).range([1, size / 100 * this.svgRatio]);


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


            let legend = {
                margin: 30,
                padding: 5,
                size: 10
            };
            const colorSet = compElemList.map((sg, i) => {
                let h = i / compElemList.length * 360;
                let s = 0.5;
                let v = 0.9;
                return chroma.hsv(h, s, v).css();
            });
            const color = d3.scaleOrdinal()
                .domain(compElemList)
                .range(colorSet);

            svg.append("g")
                .selectAll("g")
                .data(compElemList)
                .join("rect")
                .attr("transform", `translate(${width / 2}, 20)`)
                .attr("x", (d, i) => i * 45)
                .attr("y", 0)
                .attr("width", legend.size)
                .attr("height", legend.size)
                .attr("fill", d => color(d));

            svg.append("g")
                .selectAll("g")
                .data(compElemList)
                .join('text')
                .attr("transform", `translate(${width / 2}, 20)`)
                .attr("x", (d, i) => i * 45 + 15)
                .attr("y", 0)
                .attr("font-size", "10px")
                .attr("text-anchor", "start")
                .attr("dominant-baseline", "text-before-edge")
                .text(d => {
                    if (d === 'self') {
                        return '自分';
                    } else if (d === 'other') {
                        return '他者';
                    } else {
                        return d;
                    }
                });

            svg.append('text')
                .text(this.label)
                .attr("x", width / 2)
                .attr("y", 0)
                .attr("fill", "#4f4f4f")
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "text-before-edge")
                .attr("font-size", "12px");



            // 描画規則の決定
            function draw(words) {
                svg.append("g")
                    .attr("transform", `translate(${width / 2},${height / 2})`)
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
                    .attr("x", d => d.x)
                    .attr("y", d => d.y)
                    .attr('class', 'vis-var')
                    .text((d) => d.text);


                const colorSet = compElemList.map((sg, i) => {
                    let h = i / compElemList.length * 360;
                    let s = 0.5;
                    let v = 0.9;
                    return chroma.hsv(h, s, v).css();
                });
                const color = d3.scaleOrdinal()
                    .domain(compElemList)
                    .range(colorSet);

                const pieChart = d3.pie().value(d => d[1]);

                const pieSvg = svg.append("g")
                    .attr("transform", `translate(${width / 2},${height / 2})`);

                words.forEach(w => {
                    let pie = pieData.find(pie => pie.word === w.text);
                    const r = w.size / 2;
                    const x = w.x;
                    const y = w.y - r;

                    const data_ready = pieChart(Object.entries(pie.data));

                    pieSvg.append("g")
                        .selectAll('pie')
                        .data(data_ready)
                        .join('path')
                        .attr('d', d3.arc()
                            .innerRadius(0)
                            .outerRadius(r)
                        )
                        .attr('fill', d => chroma(color(d.data[1])).alpha(0.4).css())
                        .attr('stroke', '#a3a3a3')
                        // .attr('stroke', d => color(d.data[1]))
                        .attr("transform", `translate(${x},${y})`)
                });   
            }
        }
    }

    drawWordCloudWithBarChart(data, barData) {
        const compElemList = this.compElemList;

        const margin = { top: 20, right: 0, bottom: 0, left: 0 };
        if (data.length > 0) {
            const fontSizeScale = (count) => Math.sqrt(count) * 10 * this.svgRatio;

            let size = Math.round(Math.sqrt(data.map(d => fontSizeScale(d.count)).reduce((sum, c) => sum + c)) * 12 * this.svgRatio);
            let width = size + margin.right;
            let height = size + margin.top;

            // svgの生成
            const view = d3.select("#main").append("div").attr("class", "view");
            const svg = view.append("svg")
                .attr("width", width - margin.left - margin.right)
                .attr("height", height - margin.top - margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            const paddingScale = d3.scaleLinear().domain([1, this.countMax]).range([1, size / 100 * this.svgRatio]);


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


            let legend = {
                margin: 30,
                padding: 5,
                size: 10
            };
            const colorSet = compElemList.map((sg, i) => {
                let h = i / compElemList.length * 360;
                let s = 0.5;
                let v = 0.9;
                return chroma.hsv(h, s, v).css();
            });
            const color = d3.scaleOrdinal()
                .domain(compElemList)
                .range(colorSet);

            svg.append("g")
                .selectAll("g")
                .data(compElemList)
                .join("rect")
                .attr("transform", `translate(20, 20)`)
                .attr("x", (d, i) => i * 65)
                .attr("y", 0)
                .attr("width", legend.size)
                .attr("height", legend.size)
                .attr("fill", d => color(d));

            svg.append("g")
                .selectAll("g")
                .data(compElemList)
                .join('text')
                .attr("transform", `translate(20, 20)`)
                .attr("x", (d, i) => i * 65 + 12)
                .attr("y", 0)
                .attr("font-size", "10px")
                .attr("text-anchor", "start")
                .attr("dominant-baseline", "text-before-edge")
                .text(d => {
                    if (d === 'self') {
                        return '自分';
                    } else if (d === 'other') {
                        return '他者';
                    } else {
                        return d;
                    }
                });

            svg.append('text')
                .text(this.label)
                .attr("x", width / 2)
                .attr("y", 0)
                .attr("fill", "#4f4f4f")
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "text-before-edge")
                .attr("font-size", "12px");


            // 描画規則の決定
            function draw(words) {
                svg.append("g")
                    .attr("transform", `translate(${width / 2},${height / 2})`)
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
                    .attr("x", d => d.x)
                    .attr("y", d => d.y)
                    .attr('class', 'vis-var')
                    .text((d) => d.text);

                const colorSet = compElemList.map((sg, i) => {
                    let h = i / compElemList.length * 360;
                    let s = 0.5;
                    let v = 0.9;
                    return chroma.hsv(h, s, v).css();
                });
                const color = d3.scaleOrdinal()
                    .domain(compElemList)
                    .range(colorSet);

                const barSvg = svg.append("g")
                    .attr("transform", `translate(${width / 2},${height / 2})`);

                words.forEach(w => {
                    let width = w.size * 0.8 * w.text.length;
                    let height = w.size * 0.8;

                    let countMax = 0;
                    let tmp = barData.find(bar => bar.word === w.text);
                    const miniData = Object.keys(tmp.data).map(key => {
                        if (countMax < tmp.data[key]) {
                            countMax = tmp.data[key];
                        }
                        return {
                            shrine: key,
                            count: tmp.data[key]
                        };
                    });

                    const xScale = d3.scaleBand()
                        .domain(miniData.map(d => d.shrine))
                        .range([0, width]);
                    
                    const yScale = d3.scaleLinear()
                        .domain([0, countMax])
                        .range([height - 0.1, 0]);

                    barSvg.selectAll("mybar")
                        .data(miniData)
                        .enter()
                        .append("rect")
                        .attr('name', w.text)
                        .attr('transform', `translate(${w.x - width / 2}, ${w.y - height})`)
                        .attr("x", d => xScale(d.shrine))
                        .attr("y", d => yScale(d.count))
                        .attr("width", xScale.bandwidth())
                        .attr("height", d => height - yScale(d.count))
                        .attr("stroke", d => color(d.shrine))
                        .attr("fill", d => chroma(color(d.shrine)).alpha(0.6).css());
                });



            }
        }
    }


    drawBarChart(data) {
        const margin = { top: 30, right: 0, bottom: 50, left: 100 };
        if (data.length > 0) {
            let width = Math.log(this.countMax) * 50 * this.svgRatio;
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
            let width = Math.log(this.countMax) * 50 * this.svgRatio;
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
                // .domain([0, this.countMax])
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
                    if (d === 'self') {
                        return '自分';
                    } else if (d === 'other') {
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


