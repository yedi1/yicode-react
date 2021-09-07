import React from 'react';
import keyMirror from 'keymirror';

import successImage from '../assets/icon--success.svg';

const AlertTypes = keyMirror({
    STANDARD: null,
    EXTENSION: null,
    INLINE: null
});

const AlertLevels = {
    SUCCESS: 'success',
    INFO: 'info',
    WARN: 'warn'
};

const alerts = [
    {
        alertId: 'createSuccess',
        alertType: AlertTypes.STANDARD,
        clearList: ['createSuccess', 'creating', 'createCopySuccess', 'creatingCopy',
            'createRemixSuccess', 'creatingRemix', 'saveSuccess', 'saveTitleSuccess','saving'],
        content: "作品已创建。",
        iconURL: successImage,
        level: AlertLevels.SUCCESS,
        maxDisplaySecs: 5
    },
    {
        alertId: 'createCopySuccess',
        alertType: AlertTypes.STANDARD,
        clearList: ['createSuccess', 'creating', 'createCopySuccess', 'creatingCopy',
            'createRemixSuccess', 'creatingRemix', 'saveSuccess', 'saveTitleSuccess', 'saving'],
        content:"作品已保存为副本。",
        iconURL: successImage,
        level: AlertLevels.SUCCESS,
        maxDisplaySecs: 5
    },
    {
        alertId: 'createRemixSuccess',
        alertType: AlertTypes.STANDARD,
        clearList: ['createSuccess', 'creating', 'createCopySuccess', 'creatingCopy',
            'createRemixSuccess', 'creatingRemix', 'saveSuccess', 'saveTitleSuccess', 'saving'],
        content: "改编作品已保存。",
        iconURL: successImage,
        level: AlertLevels.SUCCESS,
        maxDisplaySecs: 5
    },
    {
        alertId: 'creating',
        alertType: AlertTypes.STANDARD,
        clearList: ['createSuccess', 'creating', 'createCopySuccess', 'creatingCopy',
            'createRemixSuccess', 'creatingRemix', 'saveSuccess', 'saveTitleSuccess', 'saving'],
        content: "正在创建...",
        iconSpinner: true,
        level: AlertLevels.SUCCESS
    },
    {
        alertId: 'creatingCopy',
        alertType: AlertTypes.STANDARD,
        clearList: ['createSuccess', 'creating', 'createCopySuccess', 'creatingCopy',
            'createRemixSuccess', 'creatingRemix', 'saveSuccess', 'saveTitleSuccess', 'saving'],
        content:"正在复制作品……",
        iconSpinner: true,
        level: AlertLevels.SUCCESS
    },
    {
        alertId: 'creatingRemix',
        alertType: AlertTypes.STANDARD,
        clearList: ['createSuccess', 'creating', 'createCopySuccess', 'creatingCopy',
            'createRemixSuccess', 'creatingRemix', 'saveSuccess', 'saveTitleSuccess', 'saving'],
        content: "正在改编作品……",
        iconSpinner: true,
        level: AlertLevels.SUCCESS
    },
    {
        alertId: 'creatingError',
        clearList: ['createSuccess', 'creating', 'createCopySuccess', 'creatingCopy',
            'createRemixSuccess', 'creatingRemix', 'saveSuccess', 'saveTitleSuccess', 'saving'],
        closeButton: true,
        content: "无法创建作品。 请再试一次！",
        level: AlertLevels.WARN
    },
    {
        alertId: 'saveTitleError',
        clearList: ['createSuccess', 'creating', 'createCopySuccess', 'creatingCopy',
            'createRemixSuccess', 'creatingRemix', 'saveSuccess', 'saveTitleSuccess', 'saving'],
        closeButton: true,
        content: "无法保存作品名。 请再试一次！",
        level: AlertLevels.WARN
    },
    {
        alertId: 'savingError',
        clearList: ['createSuccess', 'creating', 'createCopySuccess', 'creatingCopy',
            'createRemixSuccess', 'creatingRemix', 'saveSuccess', 'saveTitleSuccess', 'saving'],
        showDownload: true,
        showSaveNow: true,
        closeButton: true,
        content: "作品未能保存。",
        level: AlertLevels.WARN
    },
    {
        alertId: 'saveSuccess',
        alertType: AlertTypes.INLINE,
        clearList: ['saveSuccess', 'saveTitleSuccess', 'saving', 'savingError'],
        content:"作品已保存。",
        iconURL: successImage,
        level: AlertLevels.SUCCESS,
        maxDisplaySecs: 3
    },
    {
        alertId: 'saveTitleSuccess',
        alertType: AlertTypes.INLINE,
        clearList: ['saveSuccess', 'saveTitleSuccess', 'saving', 'savingError'],
        content: "作品名已保存。",
        iconURL: successImage,
        level: AlertLevels.SUCCESS,
        maxDisplaySecs: 3
    },
    {
        alertId: 'saving',
        alertType: AlertTypes.INLINE,
        clearList: ['saveSuccess', 'saveTitleSuccess', 'saving', 'savingError'],
        content: "正在保存作品……",
        iconSpinner: true,
        level: AlertLevels.INFO
    },
    {
        alertId: 'cloudInfo',
        alertType: AlertTypes.STANDARD,
        clearList: ['cloudInfo'],
        content: '请注意，云变量只支持数字，不能存放字母和符号。<a href="/faq/#clouddata" rel="noopener noreferrer" target="_blank">进一步了解</a>。',
        closeButton: true,
        level: AlertLevels.SUCCESS,
        maxDisplaySecs: 15
    },
    {
        alertId: 'importingAsset',
        alertType: AlertTypes.STANDARD,
        clearList: [],
        content: "正在导入……",
        iconSpinner: true,
        level: AlertLevels.SUCCESS
    }
];

export {
    alerts as default,
    AlertLevels,
    AlertTypes
};
