(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.JuunCommandParser = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
    'use strict';

    const devices = [
        { id: 'tv', name: 'Televisi', led: 1, aliases: ['televisi', 'tv'] },
        { id: 'ac', name: 'AC', led: 2, aliases: ['air conditioner', 'pendingin ruangan', 'ac'] },
        { id: 'lamp', name: 'Lampu ruangan', led: 3, aliases: ['lampu ruangan', 'lampu kamar', 'lampu'] },
        { id: 'fan', name: 'Kipas angin', led: 4, aliases: ['kipas angin', 'kipas'] },
        { id: 'rice', name: 'Rice cooker', led: 5, aliases: ['rice cooker', 'magic com', 'penanak nasi'] },
        { id: 'computer', name: 'Komputer', led: 6, aliases: ['komputer', 'computer', 'pc'] }
    ];
    const actionsPattern = /\b(nyalakan|nyalain|hidupkan|hidupin|aktifkan|matikan|matiin|padamkan|non[\s-]*aktifkan|turn\s+on|turn\s+off)\b/gi;
    const allPattern = /\b(?:semua|seluruh)\s+(?:perangkat|peralatan|alat|device|devices)|semuanya|all\s+(?:perangkat|devices)\b/gi;
    const negationPattern = /\b(?:jangan|tidak|tak|belum|bukan)\b/i;
    const boundaryPattern = /[,;.!?]|\b(?:dan|lalu|kemudian|tetapi|tapi|namun|sedangkan|cukup)\b/gi;
    const fillerPattern = /\b(?:dan|lalu|kemudian|tetapi|tapi|namun|sedangkan|cukup|tolong|coba|juun|ya|dong|deh|saja|aja|sekarang|semua|seluruh|semuanya|perangkat|peralatan|alat|device|devices|nya|please)\b/g;

    function escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function normalize(value) {
        return String(value || '')
            .toLocaleLowerCase('id-ID')
            .replace(/[’']/g, ' ')
            .replace(/[^\p{L}\p{N}\s.,;!?-]/gu, ' ')
            .replace(/\bnya\b/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function clauseIsNegated(prefix) {
        let boundary;
        let lastBoundary = -1;
        boundaryPattern.lastIndex = 0;
        while ((boundary = boundaryPattern.exec(prefix)) !== null) {
            lastBoundary = boundary.index + boundary[0].length;
        }
        return negationPattern.test(prefix.slice(lastBoundary + 1));
    }

    function parseClause(clause) {
        let remaining = normalize(clause);
        const allMatch = allPattern.test(remaining);
        allPattern.lastIndex = 0;
        remaining = remaining.replace(allPattern, ' ');

        const matchedDevices = [];
        const devicePositions = new Map();
        const aliases = devices.flatMap(device => device.aliases.map(alias => ({ device, alias })))
            .sort((left, right) => right.alias.length - left.alias.length);

        for (const { device, alias } of aliases) {
            const pattern = new RegExp('(^|[^\\p{L}\\p{N}])' + escapeRegExp(alias).replace(/\s+/g, '\\s+') + '(?=$|[^\\p{L}\\p{N}])', 'gu');
            let found = false;
            remaining = remaining.replace(pattern, (match, prefix, offset) => {
                found = true;
                const position = offset + prefix.length;
                if (!devicePositions.has(device.led) || position < devicePositions.get(device.led)) devicePositions.set(device.led, position);
                return prefix + ' ';
            });
            if (found && !matchedDevices.includes(device)) matchedDevices.push(device);
        }
        matchedDevices.sort((left, right) => devicePositions.get(left.led) - devicePositions.get(right.led));

        const unknownWords = remaining
            .replace(fillerPattern, ' ')
            .match(/[\p{L}\p{N}]+/gu) || [];

        if (unknownWords.length) {
            return { error: `Aku belum mengenali "${unknownWords.join(' ')}" sebagai perangkat. Perangkat mana yang kamu maksud?` };
        }
        if (allMatch) return { devices, all: true };
        if (!matchedDevices.length) return { error: 'Perangkatnya belum jelas. Perangkat mana yang ingin kamu kendalikan?' };
        return { devices: matchedDevices, all: false };
    }

    function parseCommand(text) {
        const source = normalize(text);
        actionsPattern.lastIndex = 0;
        const matches = [...source.matchAll(actionsPattern)];
        if (!matches.length) return { type: 'none', actions: [], bulkAction: null };

        const groups = [];
        let previousEnd = 0;
        for (let index = 0; index < matches.length; index++) {
            const match = matches[index];
            const verb = match[0].replace(/[\s-]/g, '');
            const prefix = source.slice(previousEnd, match.index);
            const end = index + 1 < matches.length ? matches[index + 1].index : source.length;
            const clause = source.slice(match.index + match[0].length, end);
            const negated = clauseIsNegated(prefix);
            previousEnd = match.index + match[0].length;

            if (negated) {
                groups.push({ negated: true, verb });
                continue;
            }

            const parsedClause = parseClause(clause);
            if (parsedClause.error) return { type: 'clarify', actions: [], bulkAction: null, message: parsedClause.error };
            const state = /^(matikan|matiin|padamkan|nonaktifkan|turnoff)$/.test(verb) ? 'OFF' : 'ON';
            groups.push({ negated: false, state, all: parsedClause.all, devices: parsedClause.devices });
        }

        const activeGroups = groups.filter(group => !group.negated);
        if (!activeGroups.length) return { type: 'negated', actions: [], bulkAction: null };

        const unique = new Map();
        for (const group of activeGroups) {
            for (const device of group.devices) {
                unique.delete(device.led);
                unique.set(device.led, { deviceId: device.id, name: device.name, led: device.led, state: group.state });
            }
        }

        const bulkAction = activeGroups.length === 1 && activeGroups[0].all ? activeGroups[0].state : null;
        return { type: 'command', actions: [...unique.values()], bulkAction };
    }

    function classifyIntentUncached(text) {
        const clean = normalize(text).replace(/[.,!?;:]+/g, ' ').replace(/\s+/g, ' ').trim();
        if (/^(perkenalan dirimu|coba kenalin dirimu|coba perkenalkan diri(?: kamu)?|perkenalkan dirimu|kenalin dong siapa kamu|kenalin dirimu)( dong)?$/.test(clean)) return { type: 'SELF_INTRODUCTION' };
        if (/^(aku siapa|siapa aku|kamu tahu aku siapa|kamu tahu siapa aku|kamu ingat namaku|ingat namaku|apa namaku)$/.test(clean)) return { type: 'USER_IDENTITY' };
        if (/^(juun siapa|siapa juun|kamu siapa|siapa kamu)$/.test(clean)) return { type: 'IDENTITY_QUESTION' };
        if (/^(hai|halo|helo|hey|hi)( juun)?$/.test(clean)) return { type: 'GREETING' };
        if (/^(jangan jadi(?: deh)?|jangan deh|nggak jadi(?: deh)?|enggak jadi(?: deh)?|gak jadi(?: deh)?|tidak jadi(?: deh)?|batal(?:kan)?|urungkan|cancel)$/.test(clean)) return { type: 'CANCEL' };
        if (/^(hmm|hem)? ?(?:mungkin|kayaknya|sepertinya)( dulu)?$/.test(clean)) return { type: 'UNCERTAIN' };
        if (/^(ya boleh|iya boleh|boleh|boleh ya|boleh (?:nyalakan|hidupkan|lakukan)(?: itu)?|ya boleh (?:nyalakan|hidupkan|lakukan)(?: itu)?|ya silakan|silakan|ya sudah coba (?:hidupkan|nyalakan)|ya sudah (?:coba )?(?:hidupkan|nyalakan)|oke (?:lakukan|nyalakan|hidupkan|coba)(?: itu)?|ok (?:lakukan|nyalakan|hidupkan|coba)(?: itu)?|gas(?: (?:nyalakan|hidupkan|lakukan))?|coba deh|coba dong|iya (?:lakukan|nyalakan|hidupkan)(?: itu)?|iya lakukan itu|lakukan itu|setuju)$/.test(clean)) return { type: 'FOLLOW_UP_ACCEPTANCE' };

        const command = parseCommand(clean);
        if (command.type === 'clarify') return { type: 'CLARIFICATION', command };
        if (command.type === 'command' || command.type === 'negated') return { type: 'DEVICE_COMMAND', command };

        if (/\b(?:suhu|temperatur|temperature|kelembapan|kelembaban|humidity|jarak|distance|data sensor|status sensor)\b/.test(clean)) return { type: 'SENSOR_QUERY' };
        if (/\b(?:panas|gerah|kepanasan)\b/.test(clean)) return { type: 'SUGGESTION', topic: 'heat' };
        return { type: 'CASUAL_CONVERSATION' };
    }

    let lastIntentText = null;
    let lastIntentResult = null;
    function classifyIntent(text) {
        const normalizedText = normalize(text);
        if (normalizedText === lastIntentText && lastIntentResult) return lastIntentResult;
        lastIntentText = normalizedText;
        lastIntentResult = classifyIntentUncached(text);
        return lastIntentResult;
    }

    function createSuggestionContext(actions, topic, now = Date.now()) {
        const safeActions = (actions || []).filter(action => Number.isInteger(action.led) && action.led >= 1 && action.led <= devices.length && (action.state === 'ON' || action.state === 'OFF'))
            .map(action => ({ deviceId: action.deviceId, name: action.name, led: action.led, state: action.state }));
        if (!safeActions.length) return null;
        return { actions: safeActions, topic: String(topic || ''), expiresAt: now + 120000 };
    }

    function resolveFollowUp(text, context, now = Date.now(), resolvedIntent = null) {
        const intent = resolvedIntent || classifyIntent(text);
        if (intent.type === 'CANCEL') return { type: 'cancel' };
        if (intent.type === 'UNCERTAIN') return { type: context && context.expiresAt > now ? 'uncertain' : 'none' };
        if (intent.type !== 'FOLLOW_UP_ACCEPTANCE') return { type: 'none' };
        if (!context || context.expiresAt <= now || !Array.isArray(context.actions) || !context.actions.length) return { type: 'clarify' };
        return { type: 'accept', actions: context.actions.map(action => ({ ...action })) };
    }

    async function executeActions(actions, options) {
        const { sendAction, readStates, bulkAction = null, sendAll } = options;
        const accepted = new Map();

        if (bulkAction && typeof sendAll === 'function') {
            try {
                const response = await sendAll(bulkAction);
                for (const action of actions) accepted.set(action.led, response?.ok === true && String(response.state || '').toUpperCase() === bulkAction);
            } catch (error) {
                for (const action of actions) accepted.set(action.led, false);
            }
        } else {
            for (const action of actions) {
                try {
                    const response = await sendAction(action);
                    accepted.set(action.led, response?.ok === true && String(response.state || '').toUpperCase() === action.state);
                } catch (error) {
                    accepted.set(action.led, false);
                }
            }
        }

        let actualStates = null;
        let verificationError = null;
        try {
            actualStates = await readStates();
        } catch (error) {
            verificationError = error;
        }

        return actions.map(action => {
            const actual = actualStates && actualStates[action.led];
            const verified = String(actual || '').toUpperCase() === action.state;
            return {
                ...action,
                accepted: accepted.get(action.led) === true,
                verified,
                success: verified,
                actualState: actual || null,
                error: verificationError ? verificationError.message : (!verified ? 'Status aktual tidak sesuai dengan perintah.' : null)
            };
        });
    }

    return { parseCommand, classifyIntent, createSuggestionContext, resolveFollowUp, executeActions };
});