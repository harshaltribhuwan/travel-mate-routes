import Speech from 'speak-tts';

const speech = new Speech();

const initSpeech = async () => {
    try {
        await speech.init({
            volume: 1,
            lang: 'en-US',
            rate: 1,
            pitch: 1,
            splitSentences: true,
        });

        const getVoicesAsync = () =>
            new Promise((resolve) => {
                let voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                    resolve(voices);
                } else {
                    window.speechSynthesis.onvoiceschanged = () => {
                        voices = window.speechSynthesis.getVoices();
                        resolve(voices);
                    };
                }
            });

        const voices = await getVoicesAsync();

        const femaleVoice = voices.find(voice =>
            voice.name === "Google US English"
        );

        if (femaleVoice) {
            speech.setVoice(femaleVoice.name);
        } else {
            console.warn("Preferred female voice not found, using default");
        }

    } catch (e) {
        console.error("Speech init failed:", e);
    }
};

export { speech, initSpeech };
