export class NameGenerator {
    constructor() {
        this.adjectives = [
            "Cosmic", "Neon", "Cyber", "Quantum", "Galactic", "Stellar", "Lunar", "Solar",
            "Digital", "Electric", "Sonic", "Rapid", "Turbo", "Hyper", "Mega", "Ultra",
            "Phantom", "Shadow", "Crimson", "Azure", "Emerald", "Golden", "Silver", "Iron",
            "Titanium", "Bionic", "Astro", "Techno", "Retro", "Future"
        ];

        this.nouns = [
            "Phoenix", "Dragon", "Tiger", "Wolf", "Eagle", "Falcon", "Hawk", "Raven",
            "Viper", "Cobra", "Python", "Jaguar", "Leopard", "Lion", "Bear", "Shark",
            "Whale", "Dolphin", "Orbit", "Comet", "Star", "Planet", "Nebula", "Nova",
            "Pulsar", "Quasar", "Vortex", "Matrix", "System", "Network", "Glitch",
            "Bot", "Droid", "Cyborg", "Titan", "Giant", "Ninja", "Samurai", "Knight",
            "Ranger", "Scout", "Pilot", "Captain", "Commander", "Voyager", "Explorer"
        ];
    }

    generate() {
        const adj = this.adjectives[Math.floor(Math.random() * this.adjectives.length)];
        const noun = this.nouns[Math.floor(Math.random() * this.nouns.length)];
        const number = Math.floor(Math.random() * 1000);
        return `${adj} ${noun} ${number}`;
    }
}
