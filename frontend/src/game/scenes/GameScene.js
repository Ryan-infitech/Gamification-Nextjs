import Phaser from "phaser";
import WorldMapScene from "./WorldMapScene";
import TutorialAreaScene from "./TutorialAreaScene";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
    this.currentAreaScene = null;
  }

  init(data) {
    this.playerData = data.playerData || {};
    this.startingArea = data.startingArea || "tutorial";
  }

  create() {
    // Set up the game scene as a controller for sub-areas
    console.log("Game scene started");

    // Load the appropriate area scene based on the starting area
    this.loadArea(this.startingArea);

    // Set up any game-wide systems
    this.setupGameSystems();
  }

  setupGameSystems() {
    // Set up game-wide systems like:
    // - Player progression tracking
    // - Achievement system
    // - Global event listeners

    // Example of setting up a game timer
    this.gameTime = 0;
    this.timeEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.gameTime += 1;
        // You could emit an event that other scenes can listen to
        this.events.emit("gameTimeUpdate", this.gameTime);
      },
      callbackScope: this,
      loop: true,
    });
  }

  loadArea(areaKey) {
    // Stop current area if exists
    if (this.currentAreaScene) {
      this.scene.stop(this.currentAreaScene);
    }

    // Load the appropriate area scene
    switch (areaKey) {
      case "tutorial":
        this.scene.launch("TutorialAreaScene", {
          parentScene: this,
          playerData: this.playerData,
        });
        this.currentAreaScene = "TutorialAreaScene";
        break;
      case "worldMap":
        this.scene.launch("WorldMapScene", {
          parentScene: this,
          playerData: this.playerData,
        });
        this.currentAreaScene = "WorldMapScene";
        break;
      default:
        console.error(`Unknown area: ${areaKey}`);
        this.currentAreaScene = null;
    }
  }

  changeArea(newAreaKey, entryPoint) {
    // This method can be called from area scenes to transition between areas
    this.loadArea(newAreaKey);
  }

  savePlayerProgress(progressData) {
    // Update player data with the latest progress
    this.playerData = {
      ...this.playerData,
      ...progressData,
    };

    // Store the progress data (could send to an API or store locally)
    console.log("Player progress updated:", this.playerData);

    // Emit an event that other systems can listen to
    this.events.emit("playerProgressUpdated", this.playerData);
  }
}
