const csvDataStart = 1;
const DICT_PATH = "./lib/dict"; // kuromoji辞書
let wordCountThreshold = 1;

const stmtIdx = 0;
const shrineIdx = 1;
const typeIdxs = [3, 4, 5];
let shrineFilterList = {};
let typeFilterList = {};

$(function () {

    var filename = './data/ema.csv';
    readData(filename)
        .then((csvData) => {
            entryShrine(csvData);
            entryType(csvData);
            init(csvData);

            $('.chbox-shrine').each(function () {
                $(this).on('input', function () {
                    shrineFilterList[String($(this).val())] = $(this).prop("checked");
                    init(csvData);
                });
            });
        });
});

function init(csvData) {
    const text = gatherText(csvData); // テキストデータの集約

    // 形態素解析
    morphologicalAnalysis(text)
        .then((wordList) => {
            const csvWordCountList = wordCount(wordList);   // 単語のカウント
            let data = csv2json(csvWordCountList);        // JSON形式に変換
            data = sortJson(data);
            drawWordCloud(data);    // ワードクラウドの描画
            drawBarChart(data);

            // イベントリスナ
            $('#word-count-min').on('input', function () {
                if ($(this).val()) {
                    wordCountThreshold = parseInt($(this).val());
                    const min = parseInt($(this).attr('min'));
                    const max = parseInt($(this).attr('max'));
                    if (wordCountThreshold < min) {
                        wordCountThreshold = min;
                        alert(`${min}以上、${max}以下の整数を入力してください`);
                    } else if (wordCountThreshold > max) {
                        wordCountThreshold = max;
                        alert(`${min}以上、${max}以下の整数を入力してください`);
                    }

                    $(this).val(wordCountThreshold);

                    data = data.filter(d => d.count >= wordCountThreshold)
                    drawWordCloud(data);
                    drawBarChart(data);
                }
            });
        });
}


function gatherText(csvData) {
    // 解説文の集約 (形態素解析をループするとエラーがでる)
    let text = '';
    for (cell of csvData) {
        if (cell[stmtIdx] != '' && shrineFilterList[cell[shrineIdx]]) {
            text += String(cell[stmtIdx] + '\n');
        }
    }
    return text;
}

function entryShrine(csvData) {
    let shrineList = [];
    let count = 0;
    csvData.forEach(cell => {
        if (cell[shrineIdx] != '' && !shrineList.includes(cell[shrineIdx])) {
            shrineList.push(cell[shrineIdx]);
            let $input = $('<input>')
                .attr('type', 'checkbox')
                .attr('id', 'shrine' + count)
                .prop('checked', true)
                .addClass('chbox-shrine')
                .val(cell[shrineIdx]);
            let $label = $('<label></label>')
                .text(cell[shrineIdx])
                .attr('for', 'shrine' + count);

            let $item = $('<div></div>').append($input, $label);
            $('#shrine-filter').append($item);

            shrineFilterList[cell[shrineIdx]] = true;
            count++;
        }
    });
}

function entryType(csvData) {
    let typeList = [];
    let count = 0;
    csvData.forEach(cell => {
        typeIdxs.forEach(typeIdx => {
            if (cell[typeIdx].length > 1) {
                if (!typeList.includes(cell[typeIdx])) {
                    typeList.push(cell[typeIdx]);
                    let $input = $('<input>')
                        .attr('type', 'checkbox')
                        .attr('id', 'type' + count)
                        .prop('checked', true)
                        .addClass('chbox-type')
                        .val(cell[typeIdx]);
                    let $label = $('<label></label>')
                        .text(cell[typeIdx])
                        .attr('for', 'type' + count);

                    let $item = $('<div></div>').append($input, $label);
                    $('#type-filter').append($item);

                    typeFilterList[cell[typeIdx]] = true;
                    count++;
                }
            }
        })

    });
}

function wordCount(wordList) {
    var csvWordCountList = [];
    wordList.forEach(word => {
        // console.log(word);
        if (word && word != '') {
            if (!csvWordCountList[word]) { // 未出なら1で初期化   
                csvWordCountList[word] = 1;
            } else { // 既出ならインクリメント
                csvWordCountList[word] += 1;
            }
        }
    });

    return csvWordCountList;
}


// function layoutKeyWord(csvData) {
//     // 単語のカウント
//     var csvWordCountList = new Array();
//     for (csvDatum of csvData) {
//         keyWordIdx.forEach(idx => {
//             var word = csvDatum[idx];
//             if (word && word != '') {
//                 if (!csvWordCountList[word]) { // 未出なら1で初期化   
//                     csvWordCountList[word] = 1;
//                 } else { // 既出ならインクリメント
//                     csvWordCountList[word] += 1;
//                 }
//             }
//         });
//     }

//     // JSON形式に変換
//     data = csv2json(csvWordCountList);

//     // ワードクラウドの描画
//     drawWordCloud(data);
// }

function readData(csvFileName) {
    return new Promise((resolve) => {
        // CSVファイルの読み込み
        const request = new XMLHttpRequest(); // HTTPでファイルを読み込む
        request.open('GET', csvFileName, true); // csvのパスを指定
        request.send();
        request.addEventListener('load', function () { // 読み込んだら実行        
            const csv = this.responseText; // 読み込んだテキストを取得

            // csvのパース
            var csvData = parseCSV(csv);
            csvData = csvData.slice(csvDataStart); // ヘッダの削除

            resolve(csvData);
        });
    });
}


function drawWordCloud(data) {
    // svgのリセット
    $('svg').remove();
    const margin = { top: 0, right: 0, bottom: 0, left: 0 };
    var width = 600;
    var height = 600;
    // var width = data.length * 1.8;
    // var height = data.length * 1.8;

    // svgの生成
    const svg = d3.select("#word-cloud").append("svg")
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var countMax = d3.max(data, function (d) { return d.count });
    var paddingScale = d3.scaleLinear().domain([1, countMax]).range([1, 8]);
    var fontSizeScale = (count) => Math.sqrt(count) * 10;


    // data = data.filter(d => d.count >= wordCountThreshold)

    //　レイアウト
    var layout = d3.layout.cloud()
        .size([width, height])
        .words(data)
        .rotate(() => 0)
        .fontSize((d) => fontSizeScale(d.count)) //単語の出現回数を文字サイズに反映
        .padding((d) => paddingScale(d.count))
        .spiral("archimedean")
        // .spiral("rectangular")
        .on("end", draw);
    // 描画する
    layout.start();


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
            .attr("transform", (d) => "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")")
            .text((d) => d.text);
    }
}

function drawBarChart(data) {
    const margin = { top: 0, right: 0, bottom: 10, left: 50 };
    var width = 600;
    var height = data.length * 10;

    var tooltip = d3.select("body").append("div").attr("class", "tooltip");

    const svg = d3.select("#bar").append("svg")
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) { return +d.count; })])
        .range([0, width]);
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Y axis
    const y = d3.scaleBand()
        .range([0, height])
        .domain(data.map(d => d.text))
        .padding(.1);
    svg.append("g")
        .call(d3.axisLeft(y))

    //Bars
    svg.selectAll("myRect")
        .data(data)
        .join("rect")
        .attr("x", x(0))
        .attr("y", d => y(d.text))
        .attr("width", d => x(d.count))
        .attr("height", y.bandwidth())
        .attr("fill", "#4f4f4f")
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
}

function parseCSV(csv) {
    let tmp = [];
    csv = csv.replace(/("[^"]*")+/g, (match) => {
        tmp.push(match.slice(1, -1).replace(/""/g, '"').replaceAll('\n', ''));
        return '[TMP]';
    });
    return csv.split("\n").map((row) => {
        return row.split(',').map((val) => {
            if (val == '[TMP]') {
                return tmp.shift();
            } else { // 日本語の空白のみ削除
                return ret = val.replace(/(\s+[^A-Za-z]|[^A-Za-z]\s+)/g, (match) => {
                    return match.replace(/\s+/g, '');
                })
            }
        });
    });
}


function csv2json(csvWordCountList) {
    var data = new Array();
    Object.keys(csvWordCountList).map(word => {
        var count = csvWordCountList[word];
        data.push({ text: word, count: count });
    });
    return data;
}

function sortJson(data) {
    return data.sort((a, b) => {
        return (a.count > b.count) ? -1 : 1;  //オブジェクトの昇順ソート
    });
}


function morphologicalAnalysis(text) {
    return new Promise((resolve) => {
        kuromoji.builder({ dicPath: DICT_PATH }).build((err, tokenizer) => {
            tokenize(text, tokenizer).then((wordList) => {
                resolve(wordList);
            })
        })
    });
}

function tokenize(text, tokenizer) {
    let wordList = [];
    return new Promise((resolve) => {
        const tokens = tokenizer.tokenize(text); // 解析データの取得

        // wordList = new Array(tokens.length);
        tokens.forEach((token, i) => { // 解析結果を順番に取得する
            // console.log(token.basic_form, token.pos, token.pos_detail_1, token.pos_detail_2, token.pos_detail_3, token.conjugated_form)
            if (token.pos == '名詞' && token.basic_form != '*' && token.pos_detail_1 != "非自立" && token.pos_detail_1 != "接尾" && token.pos_detail_1 != "代名詞" && token.pos_detail_1 != "数") {
                wordList.push(token.basic_form);
            }
        });

        resolve(wordList);
    });
}