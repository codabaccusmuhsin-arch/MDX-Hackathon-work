// Elements
const chatEl = document.getElementById("chat");
const input = document.getElementById("message");
const sendBtn = document.getElementById("send");
const startBtn = document.getElementById("startGame");
const resetBtn = document.getElementById("resetGame");
const heroHP = document.getElementById("heroHP");
const villainHP = document.getElementById("villainHP");
const publicHP = document.getElementById("publicHP");
const heroLabel = document.getElementById("heroLabel");
const villainLabel = document.getElementById("villainLabel");
// Sidebar toggle
const userBtn = document.getElementById('userBtn');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');

// Toggle sidebar on button click
userBtn.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// Close sidebar on close button click
closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('active');
});


// State
let userPrompts = 0;
let hero = null;
let villain = null;
let gameActive = false;
let currentScenario = null;
let turnCount = 0;

// Utilities
function addMessage(text, who = "bot") {
    const line = document.createElement("div");
    line.className = `msg ${who}`;
    const whoEl = document.createElement("span");
    whoEl.className = "who";
    
    if (who === "user") {
        whoEl.textContent = "YOU:";
    } else if (who === "villain") {
        whoEl.textContent = `${villain.name.toUpperCase()}:`;
    } else {
        whoEl.textContent = "JARVIS:";
    }
    
    const textEl = document.createElement("span");
    textEl.textContent = " " + text;
    line.appendChild(whoEl);
    line.appendChild(textEl);
    chatEl.appendChild(line);
    chatEl.scrollTop = chatEl.scrollHeight;
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function containsAny(str, arr) {
    return arr.some(a => str.includes(a));
}

// Dark mode
function toggleDarkMode(enable) {
    if (enable) {
        document.body.classList.add("dark");
        addMessage("Dark mode enabled.");
    } else {
        document.body.classList.remove("dark");
        addMessage("Dark mode disabled.");
    }
}

// Villain generator
function generateVillain(heroWeakness) {
    const names = ["Loki", "Thanos", "Red Skull", "Ultron", "Venom", "Green Goblin", "Doctor Doom", "Magneto"];
    const name = names[randInt(0, names.length - 1)];
    const tags = ["tech", "psychic", "elemental", "toxin", "gravity", "time"];
    const tag = tags[randInt(0, tags.length - 1)];
    const edgeFromWeakness = (heroWeakness || "").toLowerCase().includes(tag) ? 5 : 0;
    return { name, tag, hp: 100, bonus: edgeFromWeakness };
}

const scenarios = [
    {
        text: (h, v) => `${v.name} hurls a meteor storm across the skyline.`,
        choices: {
            "shield ecosystem": { heroDmg: [12, 20], villainDmg: [0, 0], envDelta: [5, 8], reply: "You shield the natural habitats. You take the hit but protect the environment." },
            "counter blast": { heroDmg: [4, 10], villainDmg: [18, 26], envDelta: [-8, -12], reply: "You fire back through the rubble. Big damage dealt, but the natural surroundings suffer." }
        }
    },
    {
        text: (h, v) => `${v.name} poisons the water grid.`,
        choices: {
            "purify water": { heroDmg: [0, 4], villainDmg: [0, 0], envDelta: [3, 6], reply: "You cleanse the reservoirs. Aquatic life is saved. The villain slips away." },
            "hunt villain": { heroDmg: [0, 6], villainDmg: [12, 18], envDelta: [-10, -14], reply: "You chase the culprit and land hits while the waterways remain contaminated." }
        }
    },
    {
        text: (h, v) => `${v.name} floods the streets with shadow clones.`,
        choices: {
            "fight clones": { heroDmg: [8, 14], villainDmg: [8, 14], envDelta: [-2, 2], reply: "You carve through clones and tag the real one mid-strike." },
            "protect green spaces": { heroDmg: [16, 24], villainDmg: [0, 4], envDelta: [10, 15], reply: "You shield parks and natural areas from destruction." }
        }
    },
    {
        text: (h, v) => "The ground splits as an engineered quake erupts.",
        choices: {
            "stabilize terrain": { heroDmg: [4, 9], villainDmg: [0, 0], envDelta: [4, 8], reply: "You brace the fault lines and prevent ecological collapse." },
            "strike villain": { heroDmg: [8, 12], villainDmg: [22, 30], envDelta: [-10, -16], reply: "You leap through the chaos and land a crushing blow, but the landscape is scarred." }
        }
    },
    {
        text: (h, v) => `${v.name} hijacks two bullet trains on a collision path.`,
        choices: {
            "prevent derailment": { heroDmg: [10, 16], villainDmg: [0, 0], envDelta: [8, 12], reply: "You decouple cars and brake both lines, preventing toxic spills." },
            "ambush villain": { heroDmg: [6, 10], villainDmg: [16, 24], envDelta: [-12, -16], reply: "You force the villain off the control grid and strike hard, but the trains crash." }
        }
    },
    {
        text: (h, v) => `${v.name} tears a time rift over the city.`,
        choices: {
            "seal rift": { heroDmg: [10, 18], villainDmg: [0, 0], envDelta: [6, 10], reply: "You stitch the rift closed before it destabilizes the local ecosystem." },
            "rush attack": { heroDmg: [6, 12], villainDmg: [20, 28], envDelta: [-8, -12], reply: "You strike while reality flickers. Heavy damage dealt but temporal pollution spreads." }
        }
    },
    {
        text: (h, v) => `${v.name} hijacks the minds of wildlife.`,
        choices: {
            "free animals": { heroDmg: [8, 14], villainDmg: [0, 6], envDelta: [7, 12], reply: "You break the mind control and return natural order to the local fauna." },
            "press advantage": { heroDmg: [6, 10], villainDmg: [14, 22], envDelta: [-10, -14], reply: "You push past the confusion to land clean hits, leaving animals in distress." }
        }
    },
    {
        text: (h, v) => `${v.name} collapses the main bridge over the river.`,
        choices: {
            "contain pollution": { heroDmg: [2, 6], villainDmg: [0, 4], envDelta: [8, 12], reply: "You prevent construction materials from contaminating the river ecosystem." },
            "attack villain": { heroDmg: [8, 14], villainDmg: [16, 24], envDelta: [-6, -10], reply: "You target the villain while debris pollutes the waterways." }
        }
    },
    {
        text: (h, v) => `${v.name} triggers a city-wide blackout.`,
        choices: {
            "protect power grid": { heroDmg: [4, 8], villainDmg: [0, 6], envDelta: [5, 9], reply: "You prevent power surges that could damage sensitive environmental systems." },
            "hunt in dark": { heroDmg: [6, 12], villainDmg: [12, 20], envDelta: [-4, -8], reply: "You pursue the villain using the darkness, causing collateral damage to infrastructure." }
        }
    },
    {
        text: (h, v) => `${v.name} unleashes a chemical cloud over the city.`,
        choices: {
            "neutralize toxins": { heroDmg: [2, 6], villainDmg: [0, 4], envDelta: [6, 10], reply: "You break down the chemicals before they can poison soil and water." },
            "direct attack": { heroDmg: [8, 14], villainDmg: [14, 22], envDelta: [-8, -12], reply: "You go straight for the villain despite environmental contamination risk." }
        }
    },
    {
        text: (h, v) => `${v.name} animates the statues into attacking.`,
        choices: {
            "minimize collateral": { heroDmg: [10, 16], villainDmg: [0, 4], envDelta: [8, 12], reply: "You protect green spaces and historical trees from the rogue statues." },
            "destroy statues": { heroDmg: [6, 12], villainDmg: [12, 18], envDelta: [-6, -10], reply: "You smash the statues, creating dust pollution and debris." }
        }
    },
    {
        text: (h, v) => `${v.name} opens a dimensional portal in the city center.`,
        choices: {
            "contain anomaly": { heroDmg: [10, 18], villainDmg: [0, 4], envDelta: [6, 10], reply: "You seal the portal before exotic energies corrupt the local ecosystem." },
            "attack villain": { heroDmg: [6, 12], villainDmg: [20, 28], envDelta: [-8, -12], reply: "You strike the villain while dimensional energies leak into the environment." }
        }
    },
    {
        text: (h, v) => `${v.name} creates a massive ice storm freezing the entire downtown.`,
        choices: {
            "melt ice safely": { heroDmg: [5, 10], villainDmg: [0, 0], envDelta: [7, 12], reply: "You carefully thaw the city to prevent flooding and soil erosion." },
            "confront directly": { heroDmg: [10, 16], villainDmg: [18, 25], envDelta: [-10, -15], reply: "You brave the storm to attack, leaving frozen destruction in your wake." }
        }
    },
    {
        text: (h, v) => `${v.name} summons a swarm of robotic insects.`,
        choices: {
            "disable swarm": { heroDmg: [6, 12], villainDmg: [8, 14], envDelta: [4, 8], reply: "You use targeted EMP pulses to disable the swarm without harming real insects." },
            "target controller": { heroDmg: [8, 14], villainDmg: [16, 22], envDelta: [-6, -10], reply: "You destroy the control device, but the disabled bots become e-waste." }
        }
    },
    {
        text: (h, v) => `${v.name} begins draining energy from the city's power grid.`,
        choices: {
            "stabilize grid": { heroDmg: [2, 6], villainDmg: [0, 0], envDelta: [3, 7], reply: "You prevent brownouts that could disrupt environmental monitoring systems." },
            "overload system": { heroDmg: [12, 18], villainDmg: [20, 28], envDelta: [-12, -16], reply: "You overload the system to shock the villain, causing an environmental disaster." }
        }
    },
    {
        text: (h, v) => `${v.name} creates illusions of natural disasters.`,
        choices: {
            "calm wildlife": { heroDmg: [4, 8], villainDmg: [10, 16], envDelta: [-5, -8], reply: "You help animals recognize the illusions as fakes, preventing panic." },
            "attack source": { heroDmg: [8, 14], villainDmg: [0, 4], envDelta: [8, 12], reply: "You target the illusion generator directly, preventing ecological confusion." }
        }
    },
    {
        text: (h, v) => `${v.name} turns the city's wildlife into aggressive mutants.`,
        choices: {
            "reverse mutation": { heroDmg: [6, 12], villainDmg: [0, 0], envDelta: [6, 10], reply: "You use your powers to restore animals to their natural state." },
            "hunt villain": { heroDmg: [8, 14], villainDmg: [14, 20], envDelta: [-8, -12], reply: "You go straight for the source, leaving mutated animals uncontrolled." }
        }
    },
    {
        text: (h, v) => `${v.name} creates a massive sinkhole under a nature reserve.`,
        choices: {
            "stabilize habitat": { heroDmg: [4, 8], villainDmg: [0, 4], envDelta: [10, 15], reply: "You protect endangered species and preserve the natural habitat." },
            "support structure": { heroDmg: [10, 16], villainDmg: [8, 14], envDelta: [5, 9], reply: "You reinforce the foundation to prevent ecosystem collapse." }
        }
    },
    {
        text: (h, v) => `${v.name} begins rewriting reality in a forested area.`,
        choices: {
            "anchor ecosystem": { heroDmg: [8, 14], villainDmg: [6, 12], envDelta: [6, 10], reply: "You focus on stabilizing the natural balance of the affected area." },
            "disrupt focus": { heroDmg: [12, 18], villainDmg: [18, 24], envDelta: [-10, -14], reply: "You attack the villain to break their concentration, risking reality tears in nature." }
        }
    },
    {
        text: (h, v) => `${v.name} launches satellites to control the weather globally.`,
        choices: {
            "preserve climate": { heroDmg: [10, 16], villainDmg: [12, 18], envDelta: [4, 8], reply: "You take out the control satellites to restore natural weather patterns." },
            "attack ground station": { heroDmg: [6, 12], villainDmg: [16, 22], envDelta: [-6, -10], reply: "You attack the villain's ground control, risking climate instability." }
        }
    },
    {
        text: (h, v) => `${v.name} begins terraforming the city into a toxic jungle.`,
        choices: {
            "restore balance": { heroDmg: [8, 14], villainDmg: [8, 14], envDelta: [6, 10], reply: "You work to restore the natural environmental balance." },
            "attack spores": { heroDmg: [12, 18], villainDmg: [16, 22], envDelta: [-8, -12], reply: "You target the spore sources, but toxic byproducts pollute the area." }
        }
    },
    {
        text: (h, v) => `${v.name} takes control of the city's water treatment systems.`,
        choices: {
            "secure water supply": { heroDmg: [4, 8], villainDmg: [0, 4], envDelta: [7, 11], reply: "You prevent contaminated water from reaching natural waterways." },
            "trace contamination": { heroDmg: [8, 14], villainDmg: [14, 20], envDelta: [-5, -9], reply: "You trace the pollution to its source, but some contaminants escape." }
        }
    },
    {
        text: (h, v) => `${v.name} begins phasing forests out of existence.`,
        choices: {
            "stabilize woodland": { heroDmg: [10, 16], villainDmg: [6, 12], envDelta: [8, 12], reply: "You work to anchor the forests in reality, preserving habitats." },
            "energy blast": { heroDmg: [14, 20], villainDmg: [18, 24], envDelta: [-10, -14], reply: "You unleash a powerful energy blast at the villain, damaging the ecosystem." }
        }
    },
    {
        text: (h, v) => `${v.name} creates a giant vortex over the ocean.`,
        choices: {
            "protect marine life": { heroDmg: [12, 18], villainDmg: [8, 14], envDelta: [7, 11], reply: "You work to dissipate the vortex before it harms aquatic ecosystems." },
            "attack core": { heroDmg: [16, 22], villainDmg: [20, 26], envDelta: [-12, -16], reply: "You fly into the vortex to attack its energy core, creating tidal disruptions." }
        }
    },
    {
        text: (h, v) => `${v.name} begins aging the natural world rapidly.`,
        choices: {
            "counter decay": { heroDmg: [10, 16], villainDmg: [6, 12], envDelta: [9, 13], reply: "You work to reverse the accelerated decay of flora and fauna." },
            "time punch": { heroDmg: [14, 20], villainDmg: [18, 24], envDelta: [-8, -12], reply: "You deliver a powerful blow that disrupts the time field, but ages nearby nature." }
        }
    },
    {
        text: (h, v) => `${v.name} turns the city's waterways into portals.`,
        choices: {
            "restore rivers": { heroDmg: [8, 14], villainDmg: [6, 12], envDelta: [6, 10], reply: "You work to seal the dangerous portals and restore natural water flow." },
            "contain leakage": { heroDmg: [4, 8], villainDmg: [12, 18], envDelta: [-6, -10], reply: "You contain the dimensional leakage, but some foreign contaminants remain." }
        }
    },
    {
        text: (h, v) => `${v.name} begins lowering coastal areas into the sea.`,
        choices: {
            "preserve coastline": { heroDmg: [14, 20], villainDmg: [8, 14], envDelta: [10, 14], reply: "You use your strength to prevent coastal erosion and habitat loss." },
            "undersea attack": { heroDmg: [10, 16], villainDmg: [16, 22], envDelta: [-10, -14], reply: "You attack the villain underwater, disrupting marine ecosystems." }
        }
    },
    {
        text: (h, v) => `${v.name} creates duplicates of natural landmarks.`,
        choices: {
            "restore authenticity": { heroDmg: [8, 14], villainDmg: [14, 20], envDelta: [-6, -10], reply: "You work to eliminate the duplicates and restore the true landscape." },
            "area containment": { heroDmg: [12, 18], villainDmg: [10, 16], envDelta: [-4, -8], reply: "You contain the duplicated areas, but some environmental confusion remains." }
        }
    },
    {
        text: (h, v) => `${v.name} begins erasing natural resources from existence.`,
        choices: {
            "preserve resources": { heroDmg: [6, 12], villainDmg: [4, 10], envDelta: [8, 12], reply: "You work to protect and restore the vanishing natural resources." },
            "energy battle": { heroDmg: [10, 16], villainDmg: [16, 22], envDelta: [-8, -12], reply: "You engage the villain directly, but resource depletion continues." }
        }
    },
    {
        text: (h, v) => `${v.name} starts a chain reaction in the city's nuclear plant.`,
        choices: {
            "contain radiation": { heroDmg: [12, 18], villainDmg: [0, 0], envDelta: [10, 15], reply: "You work to contain the radiation and prevent environmental catastrophe." },
            "cool reactors": { heroDmg: [8, 14], villainDmg: [6, 12], envDelta: [7, 11], reply: "You focus on cooling the reactors to prevent meltdown and contamination." }
        }
    },
    {
        text: (h, v) => `${v.name} begins turning forests into crystal.`,
        choices: {
            "restore nature": { heroDmg: [10, 16], villainDmg: [6, 12], envDelta: [9, 13], reply: "You work to reverse the crystallization and restore living ecosystems." },
            "protective barrier": { heroDmg: [6, 12], villainDmg: [12, 18], envDelta: [5, 9], reply: "You create barriers to protect unaffected areas from the crystal spread." }
        }
    },
    {
        text: (h, v) => `${v.name} creates a field that randomizes gravity in nature reserves.`,
        choices: {
            "stabilize ecosystems": { heroDmg: [8, 14], villainDmg: [6, 12], envDelta: [7, 11], reply: "You work to restore normal gravity to protect wildlife and plant life." },
            "zero-g adaptation": { heroDmg: [10, 16], villainDmg: [14, 20], envDelta: [-6, -10], reply: "You adapt to fight in zero-g, but wildlife struggles with the changes." }
        }
    },
    {
        text: (h, v) => `${v.name} begins summoning ancient monsters from beneath the earth.`,
        choices: {
            "protect habitats": { heroDmg: [12, 18], villainDmg: [8, 14], envDelta: [8, 12], reply: "You work to minimize ecological damage while battling the creatures." },
            "seal depths": { heroDmg: [10, 16], villainDmg: [14, 20], envDelta: [6, 10], reply: "You focus on closing the dimensional rift to prevent further incursions." }
        }
    },
    {
        text: (h, v) => `${v.name} starts a pandemic that affects plant life.`,
        choices: {
            "develop antidote": { heroDmg: [6, 12], villainDmg: [4, 10], envDelta: [8, 12], reply: "You work to create and distribute a cure for the plant blight." },
            "quarantine areas": { heroDmg: [4, 8], villainDmg: [8, 14], envDelta: [6, 10], reply: "You contain the affected areas to prevent spread to healthy ecosystems." }
        }
    },
    {
        text: (h, v) => `${v.name} begins merging technology with natural organisms.`,
        choices: {
            "reverse fusion": { heroDmg: [10, 16], villainDmg: [8, 14], envDelta: [7, 11], reply: "You work to separate the fused technology from living beings and plants." },
            "destroy nanites": { heroDmg: [8, 14], villainDmg: [14, 20], envDelta: [-6, -10], reply: "You target the nanites, but some organic life is lost in the process." }
        }
    },
    {
        text: (h, v) => `${v.name} creates a massive sound wave that disrupts animal communication.`,
        choices: {
            "dampen frequencies": { heroDmg: [8, 14], villainDmg: [6, 12], envDelta: [8, 12], reply: "You create counter-sound waves to restore natural animal communication." },
            "acoustic shielding": { heroDmg: [6, 12], villainDmg: [10, 16], envDelta: [6, 10], reply: "You generate barriers around wildlife areas to protect them from the sound waves." }
        }
    },
    {
        text: (h, v) => `${v.name} begins accelerating invasive species growth.`,
        choices: {
            "restore balance": { heroDmg: [8, 14], villainDmg: [6, 12], envDelta: [7, 11], reply: "You work to control and eliminate the invasive species threatening ecosystems." },
            "containment burn": { heroDmg: [10, 16], villainDmg: [12, 18], envDelta: [-6, -10], reply: "You use controlled burns to contain the spread, but some native habitat is lost." }
        }
    },
    {
        text: (h, v) => `${v.name} starts disrupting migration patterns.`,
        choices: {
            "guide animals": { heroDmg: [6, 12], villainDmg: [4, 10], envDelta: [9, 13], reply: "You work to restore natural migration paths and protect disoriented wildlife." },
            "disable disruptor": { heroDmg: [8, 14], villainDmg: [12, 18], envDelta: [-5, -9], reply: "You search for and destroy the migration-disrupting device." }
        }
    },
    {
        text: (h, v) => `${v.name} begins disassembling matter in natural formations.`,
        choices: {
            "stabilize geology": { heroDmg: [12, 18], villainDmg: [8, 14], envDelta: [8, 12], reply: "You work to counter the molecular destabilization of natural rock formations." },
            "energy containment": { heroDmg: [10, 16], villainDmg: [14, 20], envDelta: [5, 9], reply: "You create protective energy shields around threatened natural landmarks." }
        }
    },
    {
        text: (h, v) => `${v.name} creates a field that randomizes photosynthesis.`,
        choices: {
            "normalize botany": { heroDmg: [14, 20], villainDmg: [10, 16], envDelta: [9, 13], reply: "You focus immense power on restoring natural plant processes." },
            "adapt chaos": { heroDmg: [8, 14], villainDmg: [16, 22], envDelta: [-8, -12], reply: "You attempt to fight within the chaotic biology to reach the villain." }
        }
    },
    {
        text: (h, v) => `${v.name} begins draining color from nature.`,
        choices: {
            "restore vibrancy": { heroDmg: [6, 12], villainDmg: [4, 10], envDelta: [7, 11], reply: "You work to return natural colors to the flora and fauna." },
            "attack chroma device": { heroDmg: [10, 16], villainDmg: [14, 20], envDelta: [-6, -10], reply: "You attack the device the villain is using to drain color from nature." }
        }
    },
    {
        text: (h, v) => `${v.name} starts a chain of explosions along gas pipelines near forests.`,
        choices: {
            "contain firestorm": { heroDmg: [10, 16], villainDmg: [0, 0], envDelta: [10, 15], reply: "You work to contain the explosions and prevent forest fires." },
            "evacuate wildlife": { heroDmg: [6, 12], villainDmg: [8, 14], envDelta: [8, 12], reply: "You focus on helping animals escape from the endangered areas." }
        }
    },
    {
        text: (h, v) => `${v.name} begins manipulating weather patterns to cause droughts.`,
        choices: {
            "restore rain cycles": { heroDmg: [12, 18], villainDmg: [8, 14], envDelta: [8, 12], reply: "You work to restore natural precipitation to the affected regions." },
            "weather shield": { heroDmg: [8, 14], villainDmg: [14, 20], envDelta: [5, 9], reply: "You create protective weather fields to counter the drought manipulation." }
        }
    },
    {
        text: (h, v) => `${v.name} starts turning forests into industrial zones.`,
        choices: {
            "reverse transformation": { heroDmg: [10, 16], villainDmg: [8, 14], envDelta: [8, 12], reply: "You work to return the forests to their natural state." },
            "sabotage machinery": { heroDmg: [12, 18], villainDmg: [12, 18], envDelta: [-6, -10], reply: "You target the industrial equipment, but pollution spreads during the fight." }
        }
    },
    {
        text: (h, v) => `${v.name} begins draining life force from natural areas.`,
        choices: {
            "restore vitality": { heroDmg: [8, 14], villainDmg: [6, 12], envDelta: [9, 13], reply: "You work to reverse the life force drain and rejuvenate the land." },
            "attack siphon": { heroDmg: [10, 16], villainDmg: [16, 22], envDelta: [-7, -11], reply: "You target and destroy the device draining life from the environment." }
        }
    },
    {
        text: (h, v) => `${v.name} creates a massive oil spill heading for marine reserves.`,
        choices: {
            "contain spill": { heroDmg: [14, 20], villainDmg: [8, 14], envDelta: [10, 15], reply: "You use your powers to contain and clean the oil spill." },
            "solidify oil": { heroDmg: [12, 18], villainDmg: [10, 16], envDelta: [8, 12], reply: "You solidify the oil to prevent it from spreading further." }
        }
    },
    {
        text: (h, v) => `${v.name} begins slowing ecological processes to a halt.`,
        choices: {
            "restore cycles": { heroDmg: [12, 18], villainDmg: [8, 14], envDelta: [9, 13], reply: "You work to restore natural decomposition and growth cycles." },
            "temporal bubble": { heroDmg: [10, 16], villainDmg: [16, 22], envDelta: [-7, -11], reply: "You create a bubble of normal time to approach the villain, but some areas remain affected." }
        }
    },
    {
        text: (h, v) => `${v.name} starts a phenomenon where natural resources vanish.`,
        choices: {
            "restore resources": { heroDmg: [8, 14], villainDmg: [10, 16], envDelta: [7, 11], reply: "You work to return vanished water, minerals and nutrients to the ecosystem." },
            "direct attack": { heroDmg: [12, 18], villainDmg: [16, 22], envDelta: [-8, -12], reply: "You attack the villain directly to end the phenomenon, but some resources are lost forever." }
        }
    },
    {
        text: (h, v) => `${v.name} begins converting natural areas into data.`,
        choices: {
            "restore physical world": { heroDmg: [10, 16], villainDmg: [8, 14], envDelta: [9, 13], reply: "You work to return digitized natural areas to their physical forms." },
            "digital counterstrike": { heroDmg: [8, 14], villainDmg: [16, 22], envDelta: [-7, -11], reply: "You enter the digital realm to combat the villain, risking permanent data loss." }
        }
    },
    {
        text: (h, v) => `${v.name} creates a field that reverses ecological relationships.`,
        choices: {
            "restore balance": { heroDmg: [12, 18], villainDmg: [10, 16], envDelta: [10, 14], reply: "You work to restore predator-prey relationships and natural symbiosis." },
            "contain chaos": { heroDmg: [8, 14], villainDmg: [12, 18], envDelta: [6, 10], reply: "You work to isolate areas where ecological relationships have been reversed." }
        }
    },
    {
        text: (h, v) => `${v.name} begins making species incompatible with their environments.`,
        choices: {
            "restore adaptation": { heroDmg: [6, 12], villainDmg: [4, 10], envDelta: [8, 12], reply: "You work to restore natural adaptations between species and their habitats." },
            "create microclimates": { heroDmg: [4, 8], villainDmg: [8, 14], envDelta: [7, 11], reply: "You create temporary protective environments for struggling species." }
        }
    },
    {
        text: (h, v) => `${v.name} starts merging ecosystems into unstable hybrids.`,
        choices: {
            "separate biomes": { heroDmg: [10, 16], villainDmg: [8, 14], envDelta: [8, 12], reply: "You work to separate mismatched ecosystem elements and restore natural order." },
            "adaptive management": { heroDmg: [8, 14], villainDmg: [14, 20], envDelta: [-6, -10], reply: "You attempt to manage the hybrid ecosystems while fighting the villain." }
        }
    },
    {
        text: (h, v) => `${v.name} begins increasing soil toxicity to lethal levels.`,
        choices: {
            "purify earth": { heroDmg: [14, 20], villainDmg: [10, 16], envDelta: [9, 13], reply: "You work to detoxify the soil and restore its natural composition." },
            "contain contamination": { heroDmg: [10, 16], villainDmg: [12, 18], envDelta: [7, 11], reply: "You create barriers to prevent the toxic soil from spreading." }
        }
    },
    {
        text: (h, v) => `${v.name} starts a cult that worships environmental destruction.`,
        choices: {
            "enlighten followers": { heroDmg: [8, 14], villainDmg: [6, 12], envDelta: [9, 13], reply: "You work to free people from the villain's influence and respect for nature." },
            "attack leader": { heroDmg: [10, 16], villainDmg: [16, 22], envDelta: [-7, -11], reply: "You directly attack the villain to break their hold on followers." }
        }
    },
    {
        text: (h, v) => `${v.name} begins erasing species from existence.`,
        choices: {
            "preserve biodiversity": { heroDmg: [12, 18], villainDmg: [10, 16], envDelta: [10, 14], reply: "You work to protect endangered species and restore vanished ones." },
            "genetic anchor": { heroDmg: [14, 20], villainDmg: [16, 22], envDelta: [-8, -12], reply: "You create genetic anchors to prevent species erasure, but some are lost." }
        }
    },
    {
        text: (h, v) => `${v.name} starts a chain reaction in the planet's magnetic field.`,
        choices: {
            "stabilize磁场": { heroDmg: [12, 18], villainDmg: [8, 14], envDelta: [9, 13], reply: "You work to stabilize the magnetic field that protects Earth's ecosystems." },
            "redirect energy": { heroDmg: [10, 16], villainDmg: [14, 20], envDelta: [6, 10], reply: "You redirect the magnetic energy away from sensitive natural areas." }
        }
    },
    {
        text: (h, v) => `${v.name} begins swapping animal traits between species.`,
        choices: {
            "restore natural forms": { heroDmg: [10, 16], villainDmg: [8, 14], envDelta: [10, 14], reply: "You work to return all species to their original natural states." },
            "find genetic source": { heroDmg: [8, 14], villainDmg: [14, 20], envDelta: [-6, -10], reply: "You search for the source of the genetic manipulation." }
        }
    },
    {
        text: (h, v) => `${v.name} starts making predators and prey switch roles.`,
        choices: {
            "restore food chains": { heroDmg: [8, 14], villainDmg: [6, 12], envDelta: [9, 13], reply: "You work to restore natural predator-prey relationships." },
            "temporary separation": { heroDmg: [12, 18], villainDmg: [12, 18], envDelta: [-7, -11], reply: "You separate confused species until natural order can be restored." }
        }
    },
    {
        text: (h, v) => `${v.name} begins accelerating ecological succession.`,
        choices: {
            "restore natural pace": { heroDmg: [16, 22], villainDmg: [12, 18], envDelta: [10, 15], reply: "You use immense power to restore the natural pace of ecological change." },
            "preserve keystones": { heroDmg: [12, 18], villainDmg: [14, 20], envDelta: [8, 12], reply: "You focus on preserving keystone species during the rapid changes." }
        }
    },
    {
        text: (h, v) => `${v.name} starts stealing sounds from nature.`,
        choices: {
            "restore soundscape": { heroDmg: [8, 14], villainDmg: [6, 12], envDelta: [8, 12], reply: "You work to return natural sounds to the silent forests and fields." },
            "vibrational harmony": { heroDmg: [10, 16], villainDmg: [16, 22], envDelta: [-7, -11], reply: "You use natural vibrations to attack the sound-stealing device." }
        }
    },
    {
        text: (h, v) => `${v.name} begins making plants grow in impossible patterns.`,
        choices: {
            "restore natural growth": { heroDmg: [10, 16], villainDmg: [8, 14], envDelta: [9, 13], reply: "You work to restore normal plant growth patterns and rhythms." },
            "botanical barriers": { heroDmg: [8, 14], villainDmg: [14, 20], envDelta: [6, 10], reply: "You create natural barriers to contain the aberrant plant growth." }
        }
    },
    {
        text: (h, v) => `${v.name} starts turning natural areas into abstract art.`,
        choices: {
            "restore wilderness": { heroDmg: [10, 16], villainDmg: [8, 14], envDelta: [8, 12], reply: "You work to return wilderness areas from their artistic transformation." },
            "natural counter": { heroDmg: [8, 14], villainDmg: [14, 20], envDelta: [-6, -10], reply: "You use natural forces to counter the villain's artistic reality." }
        }
    },
    {
        text: (h, v) => `${v.name} begins making shadows toxic to plant life.`,
        choices: {
            "purify darkness": { heroDmg: [12, 18], villainDmg: [10, 16], envDelta: [8, 12], reply: "You work to neutralize the toxic shadows and restore healthy shade." },
            "light therapy": { heroDmg: [10, 16], villainDmg: [16, 22], envDelta: [-7, -11], reply: "You use carefully calibrated light to counteract the shadow toxicity." }
        }
    },
    {
        text: (h, v) => `${v.name} starts a revolution among the city's animal population.`,
        choices: {
            "restore natural order": { heroDmg: [10, 16], villainDmg: [8, 14], envDelta: [8, 12], reply: "You work to restore the natural balance between humans and animals." },
            "communicate peace": { heroDmg: [6, 12], villainDmg: [12, 18], envDelta: [7, 11], reply: "You attempt to establish peaceful communication with the awakened animals." }
        }
    }
];

// Choice aliases for UX - updated for environmental focus
const choiceAliases = {
    "shield": "shield ecosystem",
    "counter": "counter blast",
    "purify": "purify water",
    "hunt": "hunt villain",
    "fight": "fight clones",
    "protect": "protect green spaces",
    "stabilize": "stabilize terrain",
    "strike": "strike villain",
    "rescue": "prevent derailment",
    "ambush": "ambush villain",
    "seal": "seal rift",
    "rush": "rush attack",
    "free": "free animals",
    "press": "press advantage",
    "melt": "melt ice safely",
    "confront": "confront directly",
    "disable": "disable swarm",
    "target": "target controller",
    "cut": "stabilize grid",
    "overload": "overload system",
    "ignore": "calm wildlife",
    "reassure": "attack source",
    "calm": "reverse mutation",
    "evacuate": "stabilize habitat",
    "support": "support structure",
    "anchor": "anchor ecosystem",
    "disrupt": "disrupt focus",
    "destroy": "preserve climate",
    "ground": "attack ground station",
    "reverse": "restore balance",
    "attack": "attack spores",
    "restore": "secure water supply",
    "trace": "trace contamination",
    "energy": "energy blast",
    "disperse": "protect marine life",
    "counter": "counter decay",
    "time": "time punch",
    "close": "restore rivers",
    "smash": "contain leakage",
    "lift": "preserve coastline",
    "underground": "undersea attack",
    "find": "restore authenticity",
    "area": "area containment",
    "mental": "energy battle",
    "contain": "contain radiation",
    "cool": "cool reactors",
    "protective": "protective barrier",
    "zero": "zero-g adaptation",
    "banish": "protect habitats",
    "cure": "develop antidote",
    "isolate": "quarantine areas",
    "nanites": "destroy nanites",
    "dampen": "dampen frequencies",
    "control": "restore balance",
    "fire": "containment burn",
    "crowd": "guide animals",
    "amplifier": "disable disruptor",
    "normalize": "normalize botany",
    "adapt": "adapt chaos",
    "color": "restore vibrancy",
    "prism": "attack chroma device",
    "luck": "weather shield",
    "constructs": "sabotage machinery",
    "drain": "attack siphon",
    "divert": "contain spill",
    "freeze": "solidify oil",
    "bubble": "temporal bubble",
    "break": "restore resources",
    "cyber": "digital counterstrike",
    "morality": "restore balance",
    "communication": "restore adaptation",
    "translator": "create microclimates",
    "separate": "separate biomes",
    "lucid": "adaptive management",
    "density": "purify earth",
    "cult": "enlighten followers",
    "leader": "attack leader",
    "history": "preserve biodiversity",
    "time": "genetic anchor",
    "magnetic": "stabilize磁场",
    "redirect": "redirect energy",
    "bodies": "restore natural forms",
    "source": "find genetic source",
    "manifestations": "temporary separation",
    "entropy": "restore natural pace",
    "preserve": "preserve keystones",
    "vibrational": "vibrational harmony",
    "loop": "restore natural growth",
    "fortress": "botanical barriers",
    "reality": "restore wilderness",
    "creative": "natural counter",
    "light": "light therapy",
    "negotiate": "communicate peace",
    "ecosystem": "shield ecosystem",
    "terrain": "stabilize terrain",
    "marine": "protect marine life",
    "wildlife": "free animals",
    "habitat": "stabilize habitat",
    "forest": "reverse transformation",
    "water": "purify water",
    "earth": "purify earth",
    "nature": "restore nature",
    "balance": "restore balance",
    "contain": "contain radiation",
    "resources": "restore resources"
};

// Start / Reset
startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);

function startGame() {
    const name = (document.getElementById("heroName").value || "Unknown Hero").trim();
    const power = (document.getElementById("heroPower").value || "Bravery").trim();
    const weakness = (document.getElementById("heroWeakness").value || "None").trim();

    hero = { name, power, weakness, hp: 100, rep: 70 };
    villain = generateVillain(weakness);

    heroLabel.textContent = `${hero.name} (${hero.power})`;
    villainLabel.textContent = `${villain.name} [${villain.tag}]`;

    heroHP.value = 100;
    villainHP.value = 100;
    publicHP.value = 70;

    gameActive = true;
    turnCount = 0;
    clearChat();

    addMessage(`Welcome, ${hero.name}. Your ${hero.power} abilities are now online.`, "bot");
    addMessage(`Threat analysis complete: ${villain.name} detected with ${villain.tag} capabilities.`, "bot");
    addMessage(`Initializing combat protocol. Good luck, ${hero.name}.`, "bot");

    nextTurn();
}

function resetGame() {
    gameActive = false;
    hero = null;
    villain = null;
    currentScenario = null;

    heroLabel.textContent = "";
    villainLabel.textContent = "";
    heroHP.value = 100;
    villainHP.value = 100;
    publicHP.value = 70;

    clearChat();
    addMessage("System reset. Enter hero details and press Start Game.", "bot");
}

function clearChat() {
    chatEl.innerHTML = "";
}

// Turn engine
function nextTurn() {
    if (!gameActive) return;
    turnCount += 1;
    currentScenario = scenarios[randInt(0, scenarios.length - 1)];
    currentScenario._tagEdge = (currentScenario.text(hero, villain).toLowerCase().includes(villain.tag)) ? villain.bonus : 0;

    addMessage(`TURN ${turnCount}: ${currentScenario.text(hero, villain)}`, "villain");
    addMessage("Available responses: " + Object.keys(currentScenario.choices).join(" | "), "bot");
}

// Apply outcome
function applyOutcome(key) {
    const data = currentScenario.choices[key];
    const heroDmg = randInt(data.heroDmg[0], data.heroDmg[1]) + (currentScenario._tagEdge || 0);
    let villainDmg = randInt(data.villainDmg[0], data.villainDmg[1]);
    let envDelta = randInt(data.envDelta[0], data.envDelta [1]);

    const p = hero.power.toLowerCase();
    const w = hero.weakness.toLowerCase();

    if (p && containsAny(key, [p.split(" ")[0]])) villainDmg = Math.round(villainDmg * 1.15);
    if (w && containsAny(currentScenario.text(hero, villain).toLowerCase(), [w.split(" ")[0]])) envDelta  = Math.round(envDelta  * 0.9);

    // Animate damage
    if (heroDmg > 0) {
        heroHP.classList.add("damage-taken");
        setTimeout(() => heroHP.classList.remove("damage-taken"), 500);
    }
    
    if (villainDmg > 0) {
        villainHP.classList.add("damage-taken");
        setTimeout(() => villainHP.classList.remove("damage-taken"), 500);
    }
    
    // Animate choice selection
    const messages = chatEl.querySelectorAll('.msg');
    if (messages.length > 0) {
        messages[messages.length - 1].classList.add("choice-selected");
        setTimeout(() => {
            if (messages[messages.length - 1]) {
                messages[messages.length - 1].classList.remove("choice-selected");
            }
        }, 500);
    }

    hero.hp = clamp(hero.hp - heroDmg, 0, 100);
    villain.hp = clamp(villain.hp - villainDmg, 0, 100);
    publicHP.value = clamp(publicHP.value + envDelta , 0, 100);
    heroHP.value = hero.hp;
    villainHP.value = villain.hp;

    addMessage(`${data.reply} Outcome: Hero -${heroDmg} HP, Villain -${villainDmg} HP, Environment ${envDelta  >= 0 ? "+" : ""}${envDelta }.`, "bot");

    checkGameOver();
    if (gameActive) setTimeout(nextTurn, 1200);
}

// Game over
function calculateScore() {
    // Hero HP and Environment HP matter most, fewer prompts = better
    const heroFactor = hero.hp;              // hero HP left
    const envFactor = publicHP.value;        // environment health
    const efficiencyFactor = Math.max(1, userPrompts); // avoid divide by 0

    // Weighted formula (you can tweak weights)
    const score = Math.round((heroFactor * 1.5 + envFactor * 2) / efficiencyFactor);
    return score;
}
function checkGameOver() {
    const scoreEl = document.getElementById("score");

    if (hero.hp <= 0) {
        const defeatMsg = document.createElement("div");
        defeatMsg.className = "msg defeat-msg";
        defeatMsg.textContent = `YOU HAVE FALLEN IN BATTLE. ${villain.name.toUpperCase()} PREVAILS.`;
        chatEl.appendChild(defeatMsg);
        gameActive = false;
        scoreEl.textContent = `Score: 0`;

    } else if (villain.hp <= 0) {
        let victoryMsgText = "";

        if (publicHP.value <= 30) {
            victoryMsgText = `YOU DEFEATED ${villain.name.toUpperCase()}, BUT AT THE COST OF THE ENVIRONMENT. A PYRRHIC VICTORY.`;
        } else if (publicHP.value >= 100) {
            victoryMsgText = `LEGENDARY VICTORY! YOU ARE CELEBRATED AS A HERO WHILE ${villain.name.toUpperCase()} FLEES IN DEFEAT!`;
        } else {
            victoryMsgText = `VICTORY! ${villain.name.toUpperCase()} HAS BEEN DEFEATED! THE DAY IS SAVED!`;
        }

        const victoryMsg = document.createElement("div");
        victoryMsg.className = "msg victory-msg";
        victoryMsg.textContent = victoryMsgText;
        chatEl.appendChild(victoryMsg);

        gameActive = false;

        // Calculate and display score only on win
        const score = calculateScore();
        scoreEl.textContent = `Score: ${score}`;

        // Send score to server
        sendScoreToServer(score);

    } else if (publicHP.value <= 0) {
        const defeatMsg = document.createElement("div");
        defeatMsg.className = "msg defeat-msg";
        defeatMsg.textContent = "THE PUBLIC HAS LOST ALL FAITH. THE ENVIRONMENT UNDERTOOK IRREVERSIBLE DAMAGE.";
        chatEl.appendChild(defeatMsg);
        gameActive = false;
        scoreEl.textContent = `Score: 0`;
    }
}

// SEND SCORE FUNCTION (outside of checkGameOver)
function sendScoreToServer(score) {
    fetch("/update_score/", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: `score=${score}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            addMessage(`Score updated! Your highscore: ${data.highscore}`, "bot");
        } else {
            addMessage(`Failed to update score: ${data.error}`, "bot");
        }
    });
}


// CSRF helper function
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Input handling
function handleSend() {
    const raw = input.value.trim();
    if (!raw) return;
    addMessage(raw, "user");
    input.value = "";
    const msg = raw.toLowerCase();
    userPrompts += 1;

    if (msg.includes("dark mode") && msg.includes("on")) { toggleDarkMode(true); return; }
    if (msg.includes("dark mode") && (msg.includes("off") || msg.includes("light") || msg.includes("disable"))) { toggleDarkMode(false); return; }

    if (!gameActive) { addMessage("Start the game first.", "bot"); return; }
    if (!currentScenario) { addMessage("Awaiting next threat assessment.", "bot"); return; }
    if (msg === "choices" || msg === "choice") { addMessage("Available responses: " + Object.keys(currentScenario.choices).join(" | "), "bot"); return; }

    let key = msg;
    if (!currentScenario.choices[key] && choiceAliases[key]) key = choiceAliases[key];
    if (!currentScenario.choices[key]) {
        const found = Object.keys(currentScenario.choices).find(c => c.startsWith(msg));
        if (found) key = found;
    }

    if (currentScenario.choices[key]) {
        applyOutcome(key);
    } else {
        addMessage("Command not recognized. Try: " + Object.keys(currentScenario.choices).join(" | "), "bot");
    }
}

sendBtn.addEventListener("click", handleSend);
input.addEventListener("keydown", (e) => { if (e.key === "Enter") handleSend(); });

// Boot message
addMessage("JARVIS: Initializing Hero Protocol. Please enter your details to begin.", "bot");
addMessage("JARVIS: Tip: Try commands like 'dark mode on', 'dark mode off', or 'choices'.", "bot");
