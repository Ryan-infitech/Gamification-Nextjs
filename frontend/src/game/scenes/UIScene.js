import Phaser from "phaser";

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene" });
  }

  init(data) {
    this.playerData = data.playerData || {};
    this.gameScene = this.scene.get(data.gameSceneKey || "GameScene");

    // Listen for events from the game scene
    if (this.gameScene) {
      this.gameScene.events.on(
        "playerProgressUpdated",
        this.updatePlayerUI,
        this
      );
      this.gameScene.events.on("gameTimeUpdate", this.updateTimer, this);
    }
  }

  create() {
    // Create UI container
    this.setupUIContainer();

    // Create the various UI elements
    this.createPlayerInfoUI();
    this.createGameTimerUI();
    this.createObjectivesUI();

    // Create menu button
    this.createMenuButton();
  }

  setupUIContainer() {
    // Create a container for all UI elements
    this.uiContainer = this.add.container(10, 10);

    // Add a semi-transparent background for the UI
    const uiBackground = this.add.rectangle(0, 0, 200, 120, 0x000000, 0.5);
    this.uiContainer.add(uiBackground);

    // Ensure UI stays fixed on screen and isn't affected by camera movement
    this.uiContainer.setScrollFactor(0);
  }

  createPlayerInfoUI() {
    // Create player name text
    this.playerNameText = this.add.text(
      10,
      10,
      `Player: ${this.playerData.username || "Coder"}`,
      {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffffff",
      }
    );

    // Create player level/score text
    this.playerLevelText = this.add.text(
      10,
      40,
      `Level: ${this.playerData.level || 1}`,
      {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
      }
    );

    this.playerScoreText = this.add.text(
      10,
      65,
      `Score: ${this.playerData.score || 0}`,
      {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
      }
    );

    // Add to UI container
    this.uiContainer.add([
      this.playerNameText,
      this.playerLevelText,
      this.playerScoreText,
    ]);
  }

  createGameTimerUI() {
    // Create timer text
    this.timerText = this.add.text(160, 10, "Time: 00:00", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffffff",
    });

    this.uiContainer.add(this.timerText);
  }

  createObjectivesUI() {
    // Create objectives header
    this.objectivesHeader = this.add.text(10, 95, "Objectives:", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffffff",
      fontWeight: "bold",
    });

    // Create objectives text (can be updated dynamically)
    this.objectivesText = this.add.text(10, 120, "Complete the tutorial", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#ffffff",
    });

    this.uiContainer.add([this.objectivesHeader, this.objectivesText]);
  }

  createMenuButton() {
    // Create a menu button in the top right
    this.menuButton = this.add.text(this.cameras.main.width - 70, 20, "MENU", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
      backgroundColor: "#444444",
      padding: { x: 10, y: 5 },
    });

    this.menuButton.setInteractive({ useHandCursor: true });
    this.menuButton.on("pointerdown", this.toggleMenu, this);

    // Ensure button stays in position
    this.menuButton.setScrollFactor(0);
  }

  toggleMenu() {
    // Pause game and show menu
    if (!this.menuOpen) {
      this.scene.pause(this.gameScene.scene.key);
      this.createPauseMenu();
      this.menuOpen = true;
    } else {
      this.closePauseMenu();
      this.scene.resume(this.gameScene.scene.key);
      this.menuOpen = false;
    }
  }

  createPauseMenu() {
    // Create menu background
    this.menuBackground = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      300,
      400,
      0x000000,
      0.8
    );

    // Create menu title
    this.menuTitle = this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2 - 150,
        "GAME MENU",
        {
          fontFamily: "Arial",
          fontSize: "24px",
          color: "#ffffff",
        }
      )
      .setOrigin(0.5);

    // Create menu options
    const resumeButton = this.createMenuOption("RESUME", -70, () =>
      this.toggleMenu()
    );
    const settingsButton = this.createMenuOption("SETTINGS", 0, () =>
      this.openSettings()
    );
    const quitButton = this.createMenuOption("QUIT GAME", 70, () =>
      this.quitGame()
    );

    // Set everything to stay fixed on screen
    [
      this.menuBackground,
      this.menuTitle,
      resumeButton,
      settingsButton,
      quitButton,
    ].forEach((item) => {
      item.setScrollFactor(0);
    });
  }

  createMenuOption(text, yOffset, callback) {
    const option = this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2 + yOffset,
        text,
        {
          fontFamily: "Arial",
          fontSize: "20px",
          color: "#ffffff",
          padding: { x: 20, y: 10 },
        }
      )
      .setOrigin(0.5);

    option.setInteractive({ useHandCursor: true });
    option.on("pointerover", () => option.setColor("#ffff00"));
    option.on("pointerout", () => option.setColor("#ffffff"));
    option.on("pointerdown", callback);

    return option;
  }

  closePauseMenu() {
    // Remove all menu elements
    if (this.menuBackground) this.menuBackground.destroy();
    if (this.menuTitle) this.menuTitle.destroy();

    // Find and destroy all menu options
    this.children.list
      .filter(
        (child) =>
          child.type === "Text" &&
          ["RESUME", "SETTINGS", "QUIT GAME"].includes(child.text)
      )
      .forEach((child) => child.destroy());
  }

  openSettings() {
    // Implement settings menu
    console.log("Settings menu would open here");
  }

  quitGame() {
    // Return to main menu
    this.scene.stop(this.gameScene.scene.key);
    this.scene.stop();
    this.scene.start("MainMenuScene");
  }

  updatePlayerUI(playerData) {
    if (this.playerLevelText) {
      this.playerLevelText.setText(`Level: ${playerData.level || 1}`);
    }

    if (this.playerScoreText) {
      this.playerScoreText.setText(`Score: ${playerData.score || 0}`);
    }
  }

  updateTimer(time) {
    // Format time as MM:SS
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

    if (this.timerText) {
      this.timerText.setText(`Time: ${formattedTime}`);
    }
  }

  updateObjective(objectiveText) {
    if (this.objectivesText) {
      this.objectivesText.setText(objectiveText);
    }
  }
}
