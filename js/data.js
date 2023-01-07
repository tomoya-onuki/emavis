class Data {
    data = {};
    shrineList = [];
    shrineFilterList = {};
    targetList = ['self', 'other'];
    targetFilterList = { 'self': true, 'other': true };
    areaList = ['U', 'R'];
    areaFilterList = { 'U': true, 'R': true };
    countMax = 0;
    wordList = [];

    constructor() {
    }


    read(filename) {
        let me = this;
        return new Promise((resolve) => {
            d3.json(filename)
                .then((data) => {
                    me.data = data;
                    $('#word-cloud').css('display', 'flex');
                    this.entryShrine();

                    const wordArr = this.wordArr();
                    const count = this.wordCount(wordArr);
                    this.countMax = this.max(count);
                    this.wordList = Array.from(new Set(wordArr));
                    resolve(me);
                });
        });
    }


    entryShrine() {
        let me = this;
        Object.keys(this.data)
            .sort()
            .forEach(shrineCode => {

                if (!me.shrineList.includes(shrineCode)) {
                    this.shrineList.push(shrineCode);
                    this.shrineFilterList[shrineCode] = true;

                    let $input = $('<input>')
                        .attr('type', 'checkbox')
                        .attr('id', shrineCode)
                        .attr('name', shrineCode)
                        .prop('checked', true)
                        .addClass('chbox-shrine');

                    let $label = $('<label></label>')
                        .text('#' + shrineCode)
                        .attr('for', shrineCode);

                    let $item = $('<div></div>').append($input, $label);
                    $('#shrine-list').append($item);

                    this.shrineFilterList[shrineCode] = true;
                }
            });
    }

    wordArr() {
        let wordList = [];
        this.shrineList.forEach(shrine => {
            this.targetList.forEach(target => {
                wordList = wordList.concat(this.data[shrine][target]);
            });
        });
        return wordList;
    }

    max(data) {
        let max = 0;
        Object.keys(data).forEach(key => {
            if (max < data[key]) {
                max = data[key];
            }
        });
        return max;
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

        return csvWordCountList;
    }
}