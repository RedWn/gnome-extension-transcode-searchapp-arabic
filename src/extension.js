import Gio from 'gi://Gio';
import Shell from 'gi://Shell';
import * as AppDisplay from 'resource:///org/gnome/shell/ui/appDisplay.js';

let originalGetInitialResultSet = null;


const TrancodeAraToEngDict = {
    'q': 'ض',
    'w': 'ص',
    'e': 'ث',
    'r': 'ق',
    't': 'ف',
    'y': 'غ',
    'u': 'ع',
    'i': 'ه',
    'o': 'خ',
    'p': 'ح',
    '[': 'ج',
    ']': 'د',
    'a': 'ش',
    's': 'س',
    'd': 'ي',
    'f': 'ب',
    'g': 'ل',
    'h': 'ا',
    'j': 'ت',
    'k': 'ن',
    'l': 'م',
    ';': 'ك',
    '\'': 'ط',
    'z': 'ئ',
    'x': 'ء',
    'c': 'ؤ',
    'v': 'ر',
    'b': 'ﻻ',
    'n': 'ى',
    'm': 'ة',
    ',': 'و',
    '.': 'ز',
    '/': 'ظ',
    '`': 'ذ'
}

const TrancodeEngToRusDict = {};

function generateInvertedDict(sourceDict, destDict) {
    for (let sourceindex in sourceDict) {
        destDict[sourceDict[sourceindex]] = sourceindex;
    }
}

function transcode(source, dict) {
    source = source.toLowerCase();
    let result = '';
    for (let i = 0; i < source.length; i++) {
        let char = source.charAt(i);
        let foundChar = dict[char];
        if (!foundChar) {
            foundChar = char;
        }
        result = result + foundChar;
    }
    return result;
}

function getResultSet(terms) {
    let query = terms.join(' ');
    let groups = Gio.DesktopAppInfo.search(query);
    groups = groups.concat(Gio.DesktopAppInfo.search(transcode(query, TrancodeAraToEngDict)));
    groups = groups.concat(Gio.DesktopAppInfo.search(transcode(query, TrancodeEngToRusDict)));
    let usage = Shell.AppUsage.get_default();
    let results = [];
    groups.forEach(function (group) {
        group = group.filter(function (appID) {
            let app = Gio.DesktopAppInfo.new(appID);
            return app && app.should_show();
        });
        results = results.concat(group.sort(function (a, b) {
            return usage.compare(a, b);
        }));
    });
    return results;
}

export default class TranscodeAppSearchExtension {
    enable() {
        generateInvertedDict(TrancodeAraToEngDict, TrancodeEngToRusDict);
        originalGetInitialResultSet = AppDisplay.AppSearchProvider.prototype.getInitialResultSet;
        AppDisplay.AppSearchProvider.prototype.getInitialResultSet = getResultSet;
    }
    disable() {
        AppDisplay.AppSearchProvider.prototype.getInitialResultSet = originalGetInitialResultSet;
        originalGetInitialResultSet = null;
    }
}
