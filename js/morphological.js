const csvDataStart = 1;
const DICT_PATH = "./lib/dict"; // kuromoji辞書
const stmtIdx = 0;
const shrineIdx = 1;
const targetIdx = 2;

class Morphological {
    shrineList = [];
    wordLists = {};

    constructor(filename) {
        this.readData(filename)
            .then((csvData) => {
                this.entryShrine(csvData);

                let promiseList = []
                this.shrineList.forEach(shrine => {

                    let text = this.gatherText(csvData, shrine, 'self');
                    promiseList.push(this.morphologicalAnalysis(text, shrine, 'self'));
                    text = this.gatherText(csvData, shrine, 'other');
                    promiseList.push(this.morphologicalAnalysis(text, shrine, 'other'));
                });

                Promise.all(promiseList).then(() => {
                    $('#load-box').hide();
                    this.dump();
                });
            });
    }


    entryShrine(csvData) {
        csvData.forEach((cell) => {
            if (cell[shrineIdx] != '' && !this.shrineList.includes(cell[shrineIdx])) {
                this.shrineList.push(cell[shrineIdx]);
            }
        });
    }


    gatherText(csvData, shrine, target) {
        // 解説文の集約 (形態素解析をループするとエラーがでる)
        let text = '';
        for (let cell of csvData) {
            // cell = cell.replace('\r', '');
            if (cell[stmtIdx] != ''
                && cell[shrineIdx] === shrine
                && cell[targetIdx].replace('\r', '') === target) {
                text += String(cell[stmtIdx] + '\n');
            }
        }
        return text;
    }


    readData(csvFileName) {
        const me = this;
        return new Promise((resolve) => {
            // CSVファイルの読み込み
            const request = new XMLHttpRequest(); // HTTPでファイルを読み込む
            request.open('GET', csvFileName, true); // csvのパスを指定
            request.send();
            request.addEventListener('load', function () { // 読み込んだら実行        
                const csv = this.responseText; // 読み込んだテキストを取得

                // csvのパース
                var csvData = me.parseCSV(csv);
                csvData = csvData.slice(csvDataStart); // ヘッダの削除

                resolve(csvData);
            });
        });
    }

    parseCSV(csv) {
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
                    return val.replace(/(\s+[^A-Za-z]|[^A-Za-z]\s+)/g, (match) => {
                        return match.replace(/\s+/g, '');
                    })
                }
            });
        });
    }

    morphologicalAnalysis(text, shrine, target) {
        this.wordLists[shrine] = {};
        // wordLists[shrine] = new Array(2);
        return new Promise((resolve) => {
            kuromoji.builder({ dicPath: DICT_PATH }).build((err, tokenizer) => {
                this.tokenize(text, tokenizer).then((wordList) => {
                    this.wordLists[shrine][target] = wordList;
                    // let idx = shrine + String(target);
                    // wordLists[idx] = wordList;
                    resolve();
                })
            })
        });
    }

    tokenize(text, tokenizer) {
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



    dump() {
        console.log(this.wordLists)
        let str = '{\n';
        let keylist = Object.keys(this.wordLists);
        keylist.forEach((key, i) => {
            str += `"${key}":{`;
            let keylist2 = Object.keys(this.wordLists[key]);
            keylist2.forEach((key2, j) => {
                str += `"${key2}":[`;
                // console.log(this.wordLists[key][key2])
                this.wordLists[key][key2].forEach((w, k) => {
                    // console.log(w);
                    str += '"' + w + '"';
                    if (k < this.wordLists[key][key2].length - 1) {
                        str += ',';
                    }
                });
                str += ']';
                if (j < keylist2.length - 1) {
                    str += ',';
                }
            });
            str += '}';
            if (i < keylist.length - 1) {
                str += ',\n';
            }
        });
        str += '}\n';
        let filename = 'ema_worddata.json';
        if (confirm(`${filename}を保存しますか`)) {
            this.save(filename, str);
        }
    }

    save(filename, text) {
        const blob = new Blob([text], { type: 'text/plain' });
        const aTag = document.createElement('a');
        aTag.href = URL.createObjectURL(blob);
        aTag.target = '_blank';
        aTag.download = filename;
        aTag.click();
        URL.revokeObjectURL(aTag.href);
    }
}