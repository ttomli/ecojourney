let previousUrl = "";

const TIMES_CLASS = ".Fk3sm";
const ICONS_CLASS = ".FkdJRd";
const TRANSIT_STEPS_CLASS = ".CMnFh";
// class contains list of divs, where each div contains multiple steps
const CAR_DISTANCE_CLASS = ".ivN21e.tUEI8e";
const OUTPUT_INPUT_DIV_CLASS = ".m6QErb";
const SPECIAL_FLIGHT_TIME_CLASS = ".uchGue";

const MY_OUTPUT_CONTAINER_NAME = "Greenify-CO2e-container"; // NAME !!! not a CLASS !


const myLoadAndInjectData = (node)=>{
    console.log('Node added:', node);
    const timeElement = node.querySelector(TIMES_CLASS);    // GOOD
    const carDistanceElement = node.querySelector(CAR_DISTANCE_CLASS);  // GOOD
    const flightTimeElement = node.querySelector(SPECIAL_FLIGHT_TIME_CLASS);    // GOOD
    const outputInputDivElement = node.querySelector(OUTPUT_INPUT_DIV_CLASS);

    if (node.classList.contains('selected')) {
        console.log('This node is selected');
    }
    // Car
    if (node.querySelector('[aria-label="Driving"]')) {
        console.log('Driving mode selected');
        console.log(`Driving distance: ${carDistanceElement.textContent} with time: ${timeElement.textContent}`)
        const km = getDistanceInKm(carDistanceElement.textContent);

        const CO2e = km * 172;
        console.log(`${km} km with CO2e: ${CO2e}`);

        injectHTML(node, CO2e);
    }
     // Transit
     else if (node.querySelector('[aria-label="Transit"]')) {
        console.log('Transit mode selected');
        console.log('Transit time:', timeElement.textContent);

        const hours = calculateTime(timeElement.textContent);

        const CO2e = 0.7 * hours * 60;  // approximate 0.7 kg CO2e per hour

        injectHTML(node, CO2e);
    }
    else if (node.querySelector('[aria-label="Cycling"]')) {
        console.log('Bicycling mode selected');
        injectHTML(node, 0);
    }
    // Walking
    else if (node.querySelector('[aria-label="Walking"]')) {
        console.log('Walking mode selected');
        injectHTML(node, 0);
    }
    // Flight
    else if (node.querySelector('[aria-label="Flights"]')) {
        // console.log(`Flight mode selected with time: ${flightTimeElement.textContent}`);
        const time = calculateTime(flightTimeElement.textContent);
        const CO2e = calculateFlightCO2e(time);
        console.log(`Flight time: ${time} hours with CO2e: ${CO2e}`);
        injectHTML(node, CO2e);
    }
}

const loadAndInjectData = (node)=>{
    console.log("LOADING AND INJECTING DATA...")

    const timeElements = node.querySelectorAll(TIMES_CLASS);    // GOOD
    const transitStepElements = node.querySelectorAll(TRANSIT_STEPS_CLASS);
    const carDistanceElements = node.querySelectorAll(CAR_DISTANCE_CLASS);  // GOOD
    const outputInputDivElements = node.querySelectorAll(OUTPUT_INPUT_DIV_CLASS);

    let transitStepElementsCount = 0;
    let carDistanceElementsCount = 0;

    // if (outputInputDivElements.length !== iconElements.length)
    //     console.log("ERROR 1");

    // console.log("number of routes: " + outputInputDivElements.length);

    // loops through each element on screen
    for (let i = 0; i < iconElements.length; i++) {
        const routeIconSrc = iconElements[i].src;

        // Car
        if (routeIconSrc.includes("car")) {
            const km = getDistanceInKm(carDistanceElements[carDistanceElementsCount].innerText);
            carDistanceElementsCount = carDistanceElementsCount + 1;

            const CO2e = km * 172;

            injectHTML(outputInputDivElements[i], CO2e);
        }

        // Transit
        if (routeIconSrc.includes("transit")) {
            const CO2es = [];
            const time = calculateTime(timeElements[i].innerText);

            const stepIconElements = transitStepElements[transitStepElementsCount].querySelectorAll("img");
            transitStepElementsCount = transitStepElementsCount + 1;

            // loops through the step icon for the single route and filters out and appends the supported vehicles
            for (let y = 0; y < stepIconElements.length; y++) {
                const stepIconSrc = stepIconElements[y].src;

                // Rail
                if (stepIconSrc.includes("rail") || stepIconSrc.includes("de-db")) {
                    if (time <= 1)
                        CO2es.push(68 * time * 28.39);
                    else if (time > 1 && time <= 2)
                        CO2es.push(85 * time * 28.39);
                    else
                        CO2es.push(100 * time * 28.39);
                    // Bus
                } else if (stepIconSrc.includes("bus")) {
                    if (stepIconSrc.includes("uk-london-bus")) {
                        CO2es.push(58 * time * 15);
                    } else {
                        // non uk buses
                        if (time <= 1)
                            CO2es.push(58 * time * 15.5);
                        else
                            CO2es.push(70 * time * 15.5);
                    }
                    // Tram
                } else if (stepIconSrc.includes("tram")) {
                    CO2es.push(25 * time * 14.696);
                    // Subway
                } else if (stepIconSrc.includes("subway") || stepIconSrc.includes("metro") || stepIconSrc.includes("uk-london-underground")) {
                    CO2es.push(35 * time * 2.4048);
                    // Ferry
                } else if (stepIconSrc.includes("ferry")) {
                    CO2es.push(50 * time * 18.74);
                }
            }

            // gets one CO2e average of the CO2es array
            const CO2e = CO2es.reduce((a,b)=>a + b, 0) / CO2es.length;

            injectHTML(outputInputDivElements[i], CO2e);
        }

        // Bike or Walk
        if (routeIconSrc.includes("bike") || routeIconSrc.includes("walk")) {
            injectHTML(outputInputDivElements[i], 0);
        }

        // Flight
        if (routeIconSrc.includes("flight")) {
            let time = 0;

            // this will most likely mean that user is on flight page
            if (timeElements.length !== iconElements.length) {
                console.log("Using special flight time scenario...")
                time = calculateTime(document.querySelector(SPECIAL_FLIGHT_TIME_CLASS).innerText);
            } else {
                time = calculateTime(timeElements[i].innerText);
            }

            let CO2e = calculateFlightCO2e(time);

            injectHTML(outputInputDivElements[i], CO2e);
        }
    }
}
;

const calculateFlightCO2e = (time)=>{
    let flightDistance = 0;
    let CO2ePerKmPerFull = 0;

    if (time <= 0.8333333333333334)
        flightDistance = time * 540;
    else if (time > 0.8333 && time <= 5)
        flightDistance = 425 + (time - 0.83333) * 852;
    else
        flightDistance = 425 + (time - 0.83333) * 940;

    if (flightDistance <= 400)
        CO2ePerKmPerFull = 150;
    else if (flightDistance > 400 && flightDistance <= 3700)
        CO2ePerKmPerFull = 240;
    else
        CO2ePerKmPerFull = 320;

    return CO2ePerKmPerFull * flightDistance;
}
;

const calculateTime = (text)=>{
    /* EXAMPLES */
    // 10 h 45 min   3 h 15 min or more   45 min   10 h

    let time = 0;

    const splittedText = text.split(" ");

    for (let i = 0; i < splittedText.length; i++) {
        // current support is for english/czech/german
        if (splittedText[i][0] === "h" || splittedText[i].includes("st")) {
            time = time + Number(splittedText[i - 1]);
        } else if (splittedText[i].includes("min") || splittedText[i].includes("protokol")) {
            time = time + Number(splittedText[i - 1]) / 60;
        } else if (splittedText[i][0] === "d" || splittedText[i].includes("tag")) {
            time = time + Number(splittedText[i - 1]) * 24;
        }
    }

    if (time <= 0) {
        console.log("UNSUPPORTED LANGUAGE");

        if (splittedText.length === 4) {
            time = Number(splittedText[0]) + Number(splittedText[2]) / 60;
        } else if (splittedText.length === 2) {
            if (Number(splittedText[0]) > 24) {
                time = Number(splittedText[0]) / 60;
            } else {
                time = Number(splittedText[0]);
            }
        }
    }
    return time;
}
;

const getDistanceInKm = (distanceText)=>{
    let km = 0;

    /* EXAMPLES */
    // 1 030 km    130 km    130 mil   1 030 km   21,4 km   24,450 km  24,450,200 km

    let distanceSplittedByKm = distanceText.split(" km");
    const distanceSplittedByMils = distanceText.split(" mi");
    // mi or mils, doesnt matter
    let inMils = false;
    if (distanceSplittedByMils.length > 1) {
        distanceSplittedByKm = distanceSplittedByMils;
        inMils = true;
    }

    const distanceSplittedByKm2 = distanceSplittedByKm[0].replaceAll(/\s/g, "");
    // 24,450   1030   24,450,200    24,2
    const splittedByComma = distanceSplittedByKm2.split(",");
    // [24, 450]   [1030]   [24, 450, 200]   [24, 2]

    if (splittedByComma.length === 2) {
        // for [24, 450] or [24, 2]
        if (splittedByComma[1].length >= 3) {
            // [24, 450]
            km = Number(distanceSplittedByKm2.replaceAll(",", ""));
            // 24450
        } else {
            // [24, 2]
            km = Number(distanceSplittedByKm2.replaceAll(",", "."));
            // 24.2
        }
    } else if (splittedByComma.length > 2) {
        // [24, 450, 200]
        km = Number(splittedByComma.join(""));
        // 24450
    } else {
        // [1030]
        km = Number(distanceSplittedByKm2);
    }

    if (inMils)
        km = km * 1.609344;

    if (distanceSplittedByKm.length === 1 && !inMils) {
        console.log("DISTANCE ISNT IN MILES AND ISNT IN KM... GOING WITH KM...");
        km = Number(distanceText.split(" ")[0]);
    }

    return km;
}
;

const injectHTML = (outputInputDivElement,CO2e)=>{
    const CO2eContainerElement = document.createElement("div");
    CO2eContainerElement.className = MY_OUTPUT_CONTAINER_NAME;

    // grams to kilos
    CO2e = CO2e / 1000;

    // this will most likely be a walk / bike
    if (CO2e <= 0) {
        CO2eContainerElement.classList.add("Greenify-CO2e-neutral-container");
        CO2eContainerElement.innerHTML = `
      <div class="Greenify-CO2e-main-text">Carbon Neutral</div>
      <svg style="margin-left: 8px;" width="24" height="22" viewBox="0 0 24 22" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_108_54)"><path d="M11.3142 21.2166C21.2454 20.1114 26.7387 13.6221 21.5365 0C17.4587 2.85391 11.885 4.71182 9.08659 8.533C10.9177 10.14 12.4289 11.9194 12.8484 14.2446C15.3748 11.1647 18.1406 8.36061 19.5963 5.24238C18.1042 12.7258 15.7655 15.5548 12.1684 19.3798C11.9187 20.0096 11.6335 20.6248 11.3142 21.2224V21.2166ZM8.46026 21.9828C0.766202 20.1114 -2.90749 14.5741 2.73329 4.74055C7.29189 9.13059 15.3345 11.9194 10.0864 21.186C9.98164 21.3803 9.86457 21.5678 9.7359 21.7472C8.79162 17.1656 5.02025 13.5398 3.91316 9.69371C4.16982 15.9781 5.98177 17.813 8.78779 22C8.67862 22 8.56944 21.9885 8.46026 21.9751V21.9828Z" fill="#01A437"/></g><defs><clipPath id="clip0_108_54"><rect width="23.5361" height="22" fill="white"/></clipPath></defs></svg>
    `;
    } else {
        const spacerQuote = document.createElement("div");
        spacerQuote.innerText = generateQuote(CO2e);
        spacerQuote.className = "Greenify-quote-container";

        let CO2eText = `${Math.round(CO2e * 10) / 10} kg CO2e`;

        if (CO2e >= 1000 && CO2e < 1000000)
            CO2eText = `${Math.round((CO2e / 1000) * 10) / 10} tons CO2e`;

        CO2eContainerElement.innerHTML = `
      <div class="Greenify-CO2e-main-text">${CO2eText}</div>
      <div class="Greenify-CO2e-tree-container">
      <div class="Greenify-CO2e-tree-text">Offset with:</div>
        ${calculateTreeAbsorbation(CO2e)}
      </div>  
    `;
        outputInputDivElement.appendChild(spacerQuote.cloneNode(true));
    }

    outputInputDivElement.appendChild(CO2eContainerElement.cloneNode(true));
}
;

const calculateTreeAbsorbation = (CO2e)=>{
    // one and only key variable
    const oneTree = 24;

    const divided = CO2e / oneTree;
    const dividedFloor = Math.floor(divided);
    const dividedRest = divided - dividedFloor;

    // icon svg's
    const fullTreeImg = `<svg style="margin-left: 6px;" width="21" height="28" viewBox="0 0 21 28" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect width="20.2344" height="28" fill="url(#pattern0)"/><defs><pattern id="pattern0" patternContentUnits="objectBoundingBox" width="1" height="1"><use xlink:href="#image0_105_52" transform="scale(0.0027027 0.00195312)"/></pattern><image id="image0_105_52" width="370" height="512" xlink:href="data:image/png;base64,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"/></defs></svg>`;
    const halfTreeImg = `<svg style="margin-left: 6px;" width="21" height="28" viewBox="0 0 21 28" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect width="20.2344" height="28" fill="url(#pattern0)" fill-opacity="0.2"/><rect width="10.1719" height="28" fill="url(#pattern1)"/><defs><pattern id="pattern0" patternContentUnits="objectBoundingBox" width="1" height="1"><use xlink:href="#image0_105_53" transform="scale(0.0027027 0.00195312)"/></pattern><pattern id="pattern1" patternContentUnits="objectBoundingBox" width="1" height="1"><use xlink:href="#image1_105_53" transform="scale(0.00537634 0.00195312)"/></pattern><image id="image0_105_53" width="370" height="512" xlink:href="data:image/png;base64,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"/><image id="image1_105_53" width="186" height="512" xlink:href="data:image/png;base64,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"/></defs></svg>`;
    const quarterTreeImg = `<svg style="margin-left: 6px;" width="21" height="28" viewBox="0 0 21 28" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect width="20.2344" height="28" fill="url(#pattern0)" fill-opacity="0.2"/><rect width="5.63281" height="28" fill="url(#pattern1)"/><defs><pattern id="pattern0" patternContentUnits="objectBoundingBox" width="1" height="1"><use xlink:href="#image0_105_51" transform="scale(0.0027027 0.00195312)"/></pattern><pattern id="pattern1" patternContentUnits="objectBoundingBox" width="1" height="1"><use xlink:href="#image1_105_51" transform="scale(0.00970874 0.00195312)"/></pattern><image id="image0_105_51" width="370" height="512" xlink:href="data:image/png;base64,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"/><image id="image1_105_51" width="103" height="512" xlink:href="data:image/png;base64,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"/></defs></svg>`;

    const outputImages = [];

    if (dividedFloor > 3) {
        outputImages.push(fullTreeImg);
        outputImages.push(`<div class="Greenify-tree-multiplier-text">x${dividedFloor}</div>`);
        return outputImages.join("");
    }

    if (dividedFloor > 0) {
        outputImages.push(fullTreeImg.repeat(dividedFloor));
        if (dividedRest > 0.44) {
            outputImages.push(halfTreeImg);
        } else if (dividedRest > 0.24) {
            outputImages.push(quarterTreeImg);
        }
    } else {
        if (dividedRest > 0.44) {
            outputImages.push(halfTreeImg);
        } else {
            outputImages.push(quarterTreeImg);
        }
    }

    return outputImages.join("");
}
;

const generateQuote = (CO2e)=>{
    // amounts are in kilos
    let listOfQuotes = [// B
    {
        amount: 4.67,
        prefix: "growing",
        postfix: "head(s) of lettuce",
    }, {
        amount: 2.25,
        prefix: "producing",
        postfix: "loaf(s) of bread",
    }, {
        amount: 0.84,
        prefix: "producing",
        postfix: "kg of asphalt",
    }, {
        amount: 402,
        prefix: "",
        postfix: "bitcoin transaction(s)",
    }, {
        amount: 0.172,
        prefix: "",
        postfix: "hour(s) of smartphone usage",
    }, {
        amount: 0.033,
        prefix: "making",
        postfix: "single use plastic bag(s)",
    }, {
        amount: 0.043,
        prefix: "a lightbulb being lit for",
        postfix: "hour(s)",
    }, {
        amount: 4.9,
        prefix: "recycling",
        postfix: "glass bottle(s)",
    }, {
        amount: 6.75,
        prefix: "",
        postfix: "t-shirt(s) being made and sent to a store",
    }, {
        amount: 0.2,
        prefix: "taking a",
        postfix: "minute(s) long hot shower",
    }, {
        amount: 15,
        prefix: "staying at a luxury hotel for",
        postfix: "night(s)",
    }, {
        amount: 0.11,
        prefix: "making",
        postfix: "paper cup(s)",
    }, {
        amount: 22,
        prefix: "burning",
        postfix: "tire(s)",
    },
    // L
    {
        amount: 0.017,
        prefix: "playing",
        postfix: "hour(s) of video games",
    }, {
        amount: 2,
        prefix: "",
        postfix: "kg of coal burned",
    }, {
        amount: 24.4,
        prefix: "",
        postfix: "propane cylinder(s) used for home barbeques",
    }, {
        amount: 0.00819,
        prefix: "",
        postfix: "smartphone(s) charged",
    }, {
        amount: 0.575,
        prefix: "",
        postfix: "day(s) of breathing",
    }, ];

    let outputQuote = {};
    let usedIndexes = [];

    // algo that tries to get suitable !random! quote
    while (usedIndexes.length !== listOfQuotes.length) {
        let randomIndex = Math.floor(Math.random() * listOfQuotes.length);
        while (usedIndexes.includes(randomIndex)) {
            randomIndex = Math.floor(Math.random() * listOfQuotes.length);
        }
        usedIndexes.push(randomIndex);

        const quote = listOfQuotes[randomIndex];
        // checking if the CO2 divided by amount of a quote isnt too low
        if (CO2e / quote.amount > 0.1) {
            outputQuote = quote;
            break;
        }
    }

    // returns carbon neutral quote, if the CO2e is too low, that it cant find a quote
    if (Object.keys(outputQuote).length === 0) {
        return `Close to zero`;
    }

    if (CO2e / outputQuote.amount > 10000)
        return `Equal to ${outputQuote.prefix} ${Math.round(CO2e / outputQuote.amount / 100) * 100} ${outputQuote.postfix}`;
    return `Equal to ${outputQuote.prefix} ${Math.round((CO2e / outputQuote.amount) * 10) / 10} ${outputQuote.postfix}`;
};

// This function is triggered when mutations are observed
function handleMutations(mutations, observer) {
    console.log('Mutations observed:', mutations);
    mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
            mutation.addedNodes.forEach(node => {
                if (node.matches && node.matches('.UgZKXd')) {  // Replace with the correct class or condition
                    // Assuming loadAndInjectData is your function to inject data
                    myLoadAndInjectData(node);
                }
            });
        }
    });
}

// Selecting the target node where mutations occur due to travel method change
// const targetNode = document.querySelector('.m6QErb.WNBkOb'); // Adjust this selector based on actual container of the routes
// const targetNode = document.querySelector('.m6QErb'); // Adjust this selector based on actual container of the routes

// // Creating an observer instance linked to the callback function
// const observer = new MutationObserver(handleMutations);

// // Configuration of the observer:
// const config = {
//     childList: true, // Observing direct children additions or deletions
//     subtree: true,  // Observing all descendants
//     attributes: false // Not observing attribute changes
// };

// // Starting the observation
// if (targetNode) {
//     observer.observe(targetNode, config);
// } else {
//     console.error('Target node not found');
// }

// Function to start the main observer
function startObserver(targetNode) {
    const observer = new MutationObserver(handleMutations);
    const config = {
        childList: true,
        subtree: true,
        attributes: false
    };
    observer.observe(targetNode, config);
}

// Function to handle mutations for the setup observer
function handleSetupMutations(mutations, observer) {
    mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
            mutation.addedNodes.forEach(node => {
                if (node.matches && node.matches('.m6QErb')) {
                    // Target node has been added, start the main observer and disconnect the setup observer
                    startObserver(node);
                    observer.disconnect();
                }
            });
        }
    });
}

// Creating a setup observer to watch for when the target node gets added
const setupObserver = new MutationObserver(handleSetupMutations);
setupObserver.observe(document, { childList: true, subtree: true });

// Remember to disconnect the observer when it's no longer needed to prevent memory leaks
// observer.disconnect();


setInterval(()=>{
    const url = location.href;

    // checks if user changed the URL
    if (url !== previousUrl) {
        // overwrite previous URL
        previousUrl = location.href;
        console.log(`URL changed to >>> ${url}`);

        // checks if user is on route search page
        if (url.includes("/maps/dir/")) {
            // const iconElements = document.querySelectorAll(ICONS_CLASS);

            // // checks if all the data we needed are rendered
            // if (iconElements.length > 0) {
            //     // checks if data are already rendered
            //     if (document.querySelectorAll("." + MY_OUTPUT_CONTAINER_NAME).length === 0) {
            //         // scrape the data off the site and then inject the desired output
            //         loadAndInjectData(iconElements);
            //     }
            // }

        }
    }
}
, 100);
