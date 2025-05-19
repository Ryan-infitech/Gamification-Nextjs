import Phaser from "phaser";
import { GameScene, TiledMapObject } from "@/types/phaser";
import { PLAYER_SPEED, TILE_SIZE } from "../config";

export default class TutorialArea extends Phaser.Scene implements GameScene {
  // Scene properties
  private map!: Phaser.Tilemaps.Tilemap;
  private player!: Phaser.Physics.Arcade.Sprite & {
    direction: "up" | "down" | "left" | "right";
    speed: number;
    updateMovement: (cursors: Phaser.Types.Input.Keyboard.CursorKeys) => void;
  };
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private tutorialTriggers: Phaser.Physics.Arcade.Group | null = null;
  private tutorialSteps: { [key: string]: boolean } = {};
  private tutorialTexts: Phaser.GameObjects.Text[] = [];
  private exitZone!: Phaser.Physics.Arcade.Sprite;
  private interactionTarget: any = null;
  private interactionActive: boolean = false;
  private lastPosition: { x: number; y: number } = { x: 0, y: 0 };
  private progressBar!: Phaser.GameObjects.Rectangle;
  private progressText!: Phaser.GameObjects.Text;

  // Tutorial state
  private currentStep: number = 0;
  private totalSteps: number = 5;
  private tutorialComplete: boolean = false;

  constructor() {
    super({ key: "TutorialArea" });
  }

  init(data: any): void {
    // Get specific spawn data
    if (data && data.spawnPosition) {
      this.lastPosition = data.spawnPosition;
    }

    // Reset tutorial progress if coming from world map
    if (data.coming_from === "WorldMap") {
      this.tutorialSteps = {};
      this.currentStep = 0;
      this.tutorialComplete = false;
    }

    // Initialize interaction state
    this.interactionActive = false;
    this.interactionTarget = null;
  }

  create(): void {
    // Create the tutorial map
    this.createMap();

    // Create the player
    this.createPlayer();

    // Set up tutorial triggers and zones
    this.createTutorialTriggers();

    // Set up UI elements
    this.createUI();

    // Set up camera to follow player
    this.cameras.main.startFollow(this.player, true);
    this.cameras.main.setZoom(2); // Adjust zoom for pixel art clarity

    // Set up controls
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Set up collisions
    this.createCollisions();

    // Show welcome message
    this.showTutorialStep("welcome");

    // Set up input for interaction
    this.input.keyboard!.on("keydown-E", this.handleInteraction, this);

    // Ambient background effects
    this.createAmbientEffects();
  }

  update(time: number, delta: number): void {
    // Update player movement
    if (this.player && this.cursors) {
      this.player.updateMovement(this.cursors);
    }

    // Check for interaction zones
    this.updateInteractionPrompts();

    // Check if tutorial is complete and player is at exit
    if (
      this.tutorialComplete &&
      this.exitZone &&
      Phaser.Geom.Rectangle.Overlaps(
        this.exitZone.getBounds(),
        this.player.getBounds()
      )
    ) {
      this.handleExit();
    }
  }

  private createMap(): void {
    // Create the tilemap from the tutorial map JSON
    this.map = this.make.tilemap({ key: "tutorial-map" });

    // Add tilesets
    const tileset1 = this.map.addTilesetImage(
      "pixel-cyberpunk-interior",
      "pixel-cyberpunk-interior"
    );
    const tileset2 = this.map.addTilesetImage(
      "robot-warfare-tiles",
      "robot-warfare-tiles"
    );

    if (!tileset1 || !tileset2) {
      console.error("Failed to load tilesets for tutorial map");
      return;
    }

    const tilesets = [tileset1, tileset2];

    // Create layers
    if (this.map.layers) {
      for (let i = 0; i < this.map.layers.length; i++) {
        const layerData = this.map.layers[i];
        if (layerData.type === "tilelayer") {
          const layer = this.map.createLayer(layerData.name, tilesets, 0, 0);
          if (layer) {
            // Set depth based on layer order
            layer.setDepth(i * 10);

            // Set collision for appropriate layers
            if (
              layerData.name === "Collision" ||
              layerData.name.includes("Walls")
            ) {
              layer.setCollisionByProperty({ collides: true });
            }
          }
        }
      }
    }

    // Set world bounds based on map dimensions
    this.physics.world.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );
  }

  private createPlayer(): void {
    // Find spawn point
    let spawnX = this.lastPosition?.x || 100;
    let spawnY = this.lastPosition?.y || 100;

    // If we have a spawn point object layer, use it
    const spawnLayer = this.map.getObjectLayer("Spawn");
    if (spawnLayer && spawnLayer.objects && spawnLayer.objects.length > 0) {
      const spawnPoint = spawnLayer.objects[0];
      spawnX = spawnPoint.x || spawnX;
      spawnY = spawnPoint.y || spawnY;
    }

    // Create the player sprite with physics
    this.player = this.physics.add.sprite(spawnX, spawnY, "player", 0) as any;
    this.player.setOrigin(0.5, 0.5);
    this.player.setCollideWorldBounds(true);

    // Add custom properties to player
    this.player.direction = "down";
    this.player.speed = PLAYER_SPEED;

    // Player update movement method (same as in WorldMap)
    this.player.updateMovement = (cursors) => {
      // Reset velocity
      this.player.setVelocity(0);

      // Diagonal movement
      let movingX = false;
      let movingY = false;

      // Horizontal movement
      if (cursors.left.isDown) {
        this.player.setVelocityX(-this.player.speed);
        this.player.direction = "left";
        movingX = true;
      } else if (cursors.right.isDown) {
        this.player.setVelocityX(this.player.speed);
        this.player.direction = "right";
        movingX = true;
      }

      // Vertical movement
      if (cursors.up.isDown) {
        this.player.setVelocityY(-this.player.speed);
        if (!movingX) this.player.direction = "up";
        movingY = true;
      } else if (cursors.down.isDown) {
        this.player.setVelocityY(this.player.speed);
        if (!movingX) this.player.direction = "down";
        movingY = true;
      }

      // Normalize diagonal movement speed
      if (movingX && movingY) {
        const normalizedSpeed = this.player.speed / Math.sqrt(2);
        this.player.setVelocity(
          this.player.body.velocity.x > 0 ? normalizedSpeed : -normalizedSpeed,
          this.player.body.velocity.y > 0 ? normalizedSpeed : -normalizedSpeed
        );
      }

      // Update animation based on movement
      if (movingX || movingY) {
        this.player.anims.play(`walk-${this.player.direction}`, true);

        // If this is the first movement, trigger the movement tutorial
        if (!this.tutorialSteps["movement"]) {
          this.tutorialSteps["movement"] = true;
          this.showTutorialStep("movement");
        }
      } else {
        // Idle animation based on last direction
        if (["up", "down"].includes(this.player.direction)) {
          this.player.anims.play(`idle-${this.player.direction}`, true);
        } else {
          // Use specific frame for idle left/right
          this.player.anims.stop();
          this.player.setFrame(this.player.direction === "left" ? 16 : 20);
        }
      }
    };
  }

  private createTutorialTriggers(): void {
    // Create a physics group for tutorial trigger zones
    this.tutorialTriggers = this.physics.add.group();

    // Get tutorial zones from Tiled map
    const tutorialLayer = this.map.getObjectLayer("TutorialTriggers");
    if (tutorialLayer && tutorialLayer.objects) {
      tutorialLayer.objects.forEach((obj) => {
        // Create invisible sprite as trigger zone
        const zone = this.physics.add.sprite(obj.x!, obj.y!, "pixel");
        zone.setAlpha(0.1); // Almost invisible, but can be seen in dev
        zone.setDisplaySize(obj.width || 32, obj.height || 32);

        // Set tutorial step data
        zone.setData("type", "tutorial");
        zone.setData("step", obj.name || "unknown");

        // Add to tutorial triggers group
        this.tutorialTriggers.add(zone);

        // If this is the exit zone, save a reference
        if (obj.name === "exit") {
          this.exitZone = zone;

          // Add visual indicator for exit
          const indicator = this.add.sprite(obj.x!, obj.y! - 20, "ui", "exit");
          indicator.setScale(0.5);
          indicator.setVisible(false);
          zone.setData("indicator", indicator);
        }
      });
    }

    // Create interactable objects for the tutorial
    this.createTutorialObjects();
  }

  private createTutorialObjects(): void {
    // Get objects from Tiled map
    const objectsLayer = this.map.getObjectLayer("Interactables");
    if (!objectsLayer || !objectsLayer.objects) return;

    objectsLayer.objects.forEach((obj) => {
      if (obj.type === "terminal") {
        // Create terminal sprite
        const terminal = this.physics.add.sprite(
          obj.x!,
          obj.y!,
          "tutorial-objects",
          "terminal"
        );
        terminal.setData("type", "terminal");
        terminal.setData("step", obj.name || "terminal");

        // Add indicator for interaction
        const indicator = this.add.sprite(
          obj.x!,
          obj.y! - 20,
          "ui",
          "terminal"
        );
        indicator.setScale(0.5);
        indicator.setVisible(false);
        terminal.setData("indicator", indicator);

        // Add to tutorial triggers for overlap detection
        this.tutorialTriggers?.add(terminal);
      } else if (obj.type === "challenge") {
        // Create challenge pod/station
        const pod = this.physics.add.sprite(
          obj.x!,
          obj.y!,
          "tutorial-objects",
          "pod"
        );
        pod.setData("type", "challenge");
        pod.setData("step", obj.name || "challenge");
        pod.setData(
          "challengeId",
          obj.properties?.find((p) => p.name === "challengeId")?.value
        );

        // Add indicator for interaction
        const indicator = this.add.sprite(
          obj.x!,
          obj.y! - 20,
          "ui",
          "challenge"
        );
        indicator.setScale(0.5);
        indicator.setVisible(false);
        pod.setData("indicator", indicator);

        // Add to tutorial triggers for overlap detection
        this.tutorialTriggers?.add(pod);
      }
    });
  }

  private createUI(): void {
    // Create progress indicator
    const progressBg = this.add.rectangle(
      this.cameras.main.width / 2,
      20,
      200,
      10,
      0x000000,
      0.5
    );
    progressBg.setScrollFactor(0);
    progressBg.setDepth(1000);

    this.progressBar = this.add.rectangle(
      this.cameras.main.width / 2 -
        100 +
        ((this.currentStep / this.totalSteps) * 200) / 2,
      20,
      (this.currentStep / this.totalSteps) * 200,
      10,
      0x00f0ff,
      1
    );
    this.progressBar.setScrollFactor(0);
    this.progressBar.setDepth(1001);
    this.progressBar.setOrigin(0, 0.5);

    // Progress text
    this.progressText = this.add.text(
      this.cameras.main.width / 2,
      40,
      `Tutorial Progress: ${this.currentStep}/${this.totalSteps}`,
      {
        fontSize: "12px",
        color: "#ffffff",
        fontFamily: "monospace",
      }
    );
    this.progressText.setScrollFactor(0);
    this.progressText.setDepth(1000);
    this.progressText.setOrigin(0.5, 0.5);
  }

  private createCollisions(): void {
    // Add collisions between player and world
    const collisionLayers = this.map.layers
      .filter(
        (layer) => layer.name === "Collision" || layer.name.includes("Walls")
      )
      .map((layer) => this.map.getLayer(layer.name).tilemapLayer);

    collisionLayers.forEach((layer) => {
      if (layer) {
        this.physics.add.collider(this.player, layer);
      }
    });

    // Add overlap with tutorial trigger zones
    if (this.tutorialTriggers) {
      this.physics.add.overlap(
        this.player,
        this.tutorialTriggers,
        this.handleTutorialTrigger,
        undefined,
        this
      );
    }
  }

  private handleTutorialTrigger(
    player: Phaser.Physics.Arcade.Sprite,
    trigger: Phaser.Physics.Arcade.Sprite
  ): void {
    const triggerType = trigger.getData("type");
    const step = trigger.getData("step");

    // Set the current interaction target
    this.interactionTarget = trigger;

    // Show interaction indicator if interactive
    if (["terminal", "challenge"].includes(triggerType)) {
      const indicator = trigger.getData("indicator");
      if (indicator && !indicator.visible) {
        indicator.setVisible(true);
      }
    }

    // For auto-trigger zones (not requiring interaction), trigger immediately
    if (
      triggerType === "tutorial" &&
      step !== "exit" &&
      !this.tutorialSteps[step]
    ) {
      this.tutorialSteps[step] = true;
      this.showTutorialStep(step);
    }
  }

  private handleInteraction(): void {
    if (!this.interactionActive && this.interactionTarget) {
      const targetType = this.interactionTarget.getData("type");
      const step = this.interactionTarget.getData("step");

      if (targetType === "terminal") {
        // Handle terminal interaction (e.g., show code interface)
        this.tutorialSteps[step] = true;
        this.showCodeTutorial(step);
      } else if (targetType === "challenge") {
        // Handle challenge interaction
        const challengeId = this.interactionTarget.getData("challengeId");
        this.tutorialSteps[step] = true;
        this.startChallenge(challengeId, step);
      }

      this.interactionActive = true;

      // Reset interaction state after short delay
      this.time.delayedCall(500, () => {
        this.interactionActive = false;
      });
    }
  }

  private updateInteractionPrompts(): void {
    // Reset interaction target
    this.interactionTarget = null;

    // Check all tutorial triggers
    if (this.tutorialTriggers) {
      this.tutorialTriggers
        .getChildren()
        .forEach((trigger: Phaser.GameObjects.GameObject) => {
          const sprite = trigger as Phaser.Physics.Arcade.Sprite;
          const triggerType = sprite.getData("type");

          // Only check interactive objects
          if (!["terminal", "challenge"].includes(triggerType)) {
            return;
          }

          const indicator = sprite.getData("indicator");

          // Calculate distance to player
          const distance = Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            sprite.x,
            sprite.y
          );

          // Show/hide interaction indicator based on proximity
          if (distance < 50) {
            this.interactionTarget = sprite;
            if (indicator) indicator.setVisible(true);
          } else {
            if (indicator) indicator.setVisible(false);
          }
        });
    }

    // If tutorial is complete, show exit indicator
    if (this.tutorialComplete && this.exitZone) {
      const indicator = this.exitZone.getData("indicator");

      // Calculate if player is near exit
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.exitZone.x,
        this.exitZone.y
      );

      if (distance < 100) {
        indicator.setVisible(true);

        if (!indicator.getData("animated")) {
          indicator.setData("animated", true);

          // Add pulsing animation
          this.tweens.add({
            targets: indicator,
            alpha: { from: 0.7, to: 1 },
            scale: { from: 0.4, to: 0.5 },
            duration: 1000,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1,
          });
        }
      }
    }
  }

  private showTutorialStep(step: string): void {
    // Clear any existing tutorial text
    this.tutorialTexts.forEach((text) => text.destroy());
    this.tutorialTexts = [];

    let title = "";
    let content = "";

    // Set text based on step
    switch (step) {
      case "welcome":
        title = "Welcome to the Tutorial";
        content =
          "In this area, you will learn the basics of the game. Use the arrow keys to move your character.";
        break;
      case "movement":
        title = "Movement Basics";
        content =
          "Good job! You can move with the arrow keys. Explore the tutorial area to learn more.";
        break;
      case "interaction":
        title = "Interaction";
        content =
          "Press E to interact with objects and characters in the world.";
        break;
      case "terminal":
        title = "Coding Terminal";
        content =
          "This is a coding terminal. Approach it and press E to interact.";
        break;
      case "challenge":
        title = "Coding Challenges";
        content =
          "Coding challenges test your skills. Complete them to earn rewards.";
        break;
      case "complete":
        title = "Tutorial Complete!";
        content =
          "You have completed the tutorial. Head to the exit to return to the main world.";
        this.tutorialComplete = true;
        // Show exit indicator
        if (this.exitZone) {
          const indicator = this.exitZone.getData("indicator");
          indicator.setVisible(true);

          this.tweens.add({
            targets: indicator,
            alpha: { from: 0.7, to: 1 },
            scale: { from: 0.4, to: 0.5 },
            duration: 1000,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1,
          });
        }
        break;
    }

    // Create tutorial message box
    const messageBg = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height - 100,
      this.cameras.main.width - 40,
      120,
      0x000000,
      0.8
    );
    messageBg.setStrokeStyle(2, 0x00f0ff);
    messageBg.setScrollFactor(0);
    messageBg.setDepth(1000);

    // Add title text
    const titleText = this.add.text(
      messageBg.x - messageBg.width / 2 + 20,
      messageBg.y - messageBg.height / 2 + 15,
      title,
      {
        fontSize: "18px",
        color: "#00f0ff",
        fontFamily: "monospace",
        fontStyle: "bold",
      }
    );
    titleText.setScrollFactor(0);
    titleText.setDepth(1001);

    // Add content text
    const contentText = this.add.text(
      messageBg.x - messageBg.width / 2 + 20,
      messageBg.y - messageBg.height / 2 + 45,
      content,
      {
        fontSize: "14px",
        color: "#ffffff",
        fontFamily: "monospace",
        wordWrap: { width: messageBg.width - 40 },
      }
    );
    contentText.setScrollFactor(0);
    contentText.setDepth(1001);

    // Add continue prompt
    const continueText = this.add.text(
      messageBg.x + messageBg.width / 2 - 150,
      messageBg.y + messageBg.height / 2 - 20,
      "Press SPACE to continue",
      {
        fontSize: "12px",
        color: "#888888",
        fontFamily: "monospace",
      }
    );
    continueText.setScrollFactor(0);
    continueText.setDepth(1001);

    // Store references to clean up later
    this.tutorialTexts.push(messageBg as any);
    this.tutorialTexts.push(titleText);
    this.tutorialTexts.push(contentText);
    this.tutorialTexts.push(continueText);

    // Add event to close dialog
    const closeDialog = () => {
      this.tutorialTexts.forEach((text) => text.destroy());
      this.tutorialTexts = [];
      this.input.keyboard!.off("keydown-SPACE", closeDialog);

      // Increment tutorial step
      this.currentStep++;
      this.updateProgress();

      // If all steps are complete, show completion
      if (this.currentStep >= this.totalSteps && !this.tutorialComplete) {
        this.showTutorialStep("complete");
      }
    };

    this.input.keyboard!.once("keydown-SPACE", closeDialog);
  }

  private showCodeTutorial(terminalType: string): void {
    // Clear any existing tutorial text
    this.tutorialTexts.forEach((text) => text.destroy());
    this.tutorialTexts = [];

    // Create code editor background
    const editorBg = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width - 100,
      this.cameras.main.height - 100,
      0x000000,
      0.9
    );
    editorBg.setStrokeStyle(2, 0x00f0ff);
    editorBg.setScrollFactor(0);
    editorBg.setDepth(1000);

    // Add title based on terminal type
    let title = "Code Terminal";
    let sampleCode =
      '// This is a code editor\n// You will use this to solve challenges\n\nfunction helloWorld() {\n  console.log("Hello, Cyber World!");\n}\n\nhelloWorld();';

    if (terminalType === "algorithm") {
      title = "Algorithm Terminal";
      sampleCode =
        "// Algorithm example\n\nfunction bubbleSort(arr) {\n  let len = arr.length;\n  for (let i = 0; i < len; i++) {\n    for (let j = 0; j < len - i - 1; j++) {\n      if (arr[j] > arr[j + 1]) {\n        // Swap elements\n        let temp = arr[j];\n        arr[j] = arr[j + 1];\n        arr[j + 1] = temp;\n      }\n    }\n  }\n  return arr;\n}";
    } else if (terminalType === "data-structure") {
      title = "Data Structure Terminal";
      sampleCode =
        "// Data Structure example\n\nclass Node {\n  constructor(data) {\n    this.data = data;\n    this.next = null;\n  }\n}\n\nclass LinkedList {\n  constructor() {\n    this.head = null;\n  }\n  \n  append(data) {\n    // Implementation here\n  }\n}";
    }

    // Add title text
    const titleText = this.add.text(
      editorBg.x - editorBg.width / 2 + 20,
      editorBg.y - editorBg.height / 2 + 15,
      title,
      {
        fontSize: "18px",
        color: "#00f0ff",
        fontFamily: "monospace",
        fontStyle: "bold",
      }
    );
    titleText.setScrollFactor(0);
    titleText.setDepth(1001);

    // Add code text with syntax highlighting simulation
    const codeText = this.add.text(
      editorBg.x - editorBg.width / 2 + 20,
      editorBg.y - editorBg.height / 2 + 45,
      sampleCode,
      {
        fontSize: "14px",
        color: "#ffffff",
        fontFamily: "monospace",
        wordWrap: { width: editorBg.width - 40 },
      }
    );

    // Simple syntax highlighting with different colors
    const coloredCode = sampleCode
      .split("\n")
      .map((line) => {
        if (line.trim().startsWith("//")) {
          return `%c${line}`;
        } else if (line.includes("function") || line.includes("class")) {
          return `%f${line}`;
        } else if (line.includes("console.log")) {
          return `%m${line}`;
        }
        return line;
      })
      .join("\n");

    codeText.setText(coloredCode);

    // Apply "syntax highlighting" by setting different colors
    const content = codeText.getWrappedText();
    const colors = {
      c: "#888888", // comments
      f: "#ff00ff", // functions/classes
      m: "#00ffff", // methods
    };

    let currentY = codeText.y;
    content.forEach((line) => {
      let color = "#ffffff";

      if (line.startsWith("%c")) {
        color = colors.c;
        line = line.substring(2);
      } else if (line.startsWith("%f")) {
        color = colors.f;
        line = line.substring(2);
      } else if (line.startsWith("%m")) {
        color = colors.m;
        line = line.substring(2);
      }

      const lineText = this.add.text(codeText.x, currentY, line, {
        fontSize: "14px",
        color: color,
        fontFamily: "monospace",
      });

      lineText.setScrollFactor(0);
      lineText.setDepth(1001);
      currentY += lineText.height;

      this.tutorialTexts.push(lineText);
    });

    codeText.setVisible(false); // Hide the original text

    // Add close button
    const closeButton = this.add.rectangle(
      editorBg.x + editorBg.width / 2 - 60,
      editorBg.y - editorBg.height / 2 + 20,
      100,
      30,
      0x333333,
      1
    );
    closeButton.setInteractive({ useHandCursor: true });
    closeButton.setScrollFactor(0);
    closeButton.setDepth(1002);

    const closeText = this.add.text(
      closeButton.x,
      closeButton.y,
      "CLOSE [ESC]",
      {
        fontSize: "12px",
        color: "#ffffff",
        fontFamily: "monospace",
      }
    );
    closeText.setOrigin(0.5);
    closeText.setScrollFactor(0);
    closeText.setDepth(1003);

    // Add instructions at the bottom
    const instructionsText = this.add.text(
      editorBg.x,
      editorBg.y + editorBg.height / 2 - 40,
      "In the full game, you will write code to solve challenges\nand earn rewards for your solutions.",
      {
        fontSize: "14px",
        color: "#00ff00",
        fontFamily: "monospace",
        align: "center",
      }
    );
    instructionsText.setOrigin(0.5);
    instructionsText.setScrollFactor(0);
    instructionsText.setDepth(1001);

    // Store references to clean up later
    this.tutorialTexts.push(editorBg as any);
    this.tutorialTexts.push(titleText);
    this.tutorialTexts.push(closeButton as any);
    this.tutorialTexts.push(closeText);
    this.tutorialTexts.push(instructionsText);

    // Handle close button click
    closeButton.on("pointerup", () => {
      this.closeCodeEditor();
    });

    // Add keyboard shortcut to close
    this.input.keyboard!.once("keydown-ESC", () => {
      this.closeCodeEditor();
    });
  }

  private closeCodeEditor(): void {
    // Clean up all tutorial elements
    this.tutorialTexts.forEach((text) => text.destroy());
    this.tutorialTexts = [];

    // Mark the terminal step as completed
    if (!this.tutorialSteps["terminal"]) {
      this.tutorialSteps["terminal"] = true;

      // Increment tutorial step
      this.currentStep++;
      this.updateProgress();

      // If all steps are complete, show completion
      if (this.currentStep >= this.totalSteps && !this.tutorialComplete) {
        this.showTutorialStep("complete");
      }
    }
  }

  private startChallenge(challengeId: string, step: string): void {
    // Show a simplified challenge interface
    const challengeBg = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width - 100,
      this.cameras.main.height - 100,
      0x000000,
      0.9
    );
    challengeBg.setStrokeStyle(2, 0xff00ff);
    challengeBg.setScrollFactor(0);
    challengeBg.setDepth(1000);

    // Add title
    const titleText = this.add.text(
      challengeBg.x,
      challengeBg.y - challengeBg.height / 2 + 40,
      "CODING CHALLENGE",
      {
        fontSize: "24px",
        color: "#ff00ff",
        fontFamily: "monospace",
        fontStyle: "bold",
      }
    );
    titleText.setOrigin(0.5);
    titleText.setScrollFactor(0);
    titleText.setDepth(1001);

    // Add description
    const descText = this.add.text(
      challengeBg.x,
      challengeBg.y - 60,
      "In this challenge, you would need to solve a\ncoding problem using JavaScript.\n\nFor example, you might be asked to implement\na function that sorts an array or finds patterns.",
      {
        fontSize: "16px",
        color: "#ffffff",
        fontFamily: "monospace",
        align: "center",
      }
    );
    descText.setOrigin(0.5);
    descText.setScrollFactor(0);
    descText.setDepth(1001);

    // Add a flashing prompt
    const promptText = this.add.text(
      challengeBg.x,
      challengeBg.y + 40,
      "Complete challenges to earn XP and unlock new areas!",
      {
        fontSize: "18px",
        color: "#00ff00",
        fontFamily: "monospace",
      }
    );
    promptText.setOrigin(0.5);
    promptText.setScrollFactor(0);
    promptText.setDepth(1001);

    // Add close button
    const closeButton = this.add.rectangle(
      challengeBg.x,
      challengeBg.y + challengeBg.height / 2 - 40,
      200,
      40,
      0x333333,
      1
    );
    closeButton.setInteractive({ useHandCursor: true });
    closeButton.setScrollFactor(0);
    closeButton.setDepth(1002);

    const closeText = this.add.text(
      closeButton.x,
      closeButton.y,
      "CLOSE [ESC]",
      {
        fontSize: "16px",
        color: "#ffffff",
        fontFamily: "monospace",
      }
    );
    closeText.setOrigin(0.5);
    closeText.setScrollFactor(0);
    closeText.setDepth(1003);

    // Flash the prompt
    this.tweens.add({
      targets: promptText,
      alpha: { from: 1, to: 0.5 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Store references to clean up later
    this.tutorialTexts = [
      challengeBg as any,
      titleText,
      descText,
      promptText,
      closeButton as any,
      closeText,
    ];

    // Handle close button click
    closeButton.on("pointerup", () => {
      this.closeChallengeModal();
    });

    // Add keyboard shortcut to close
    this.input.keyboard!.once("keydown-ESC", () => {
      this.closeChallengeModal();
    });
  }

  private closeChallengeModal(): void {
    // Clean up all tutorial elements
    this.tutorialTexts.forEach((text) => text.destroy());
    this.tutorialTexts = [];

    // Mark the challenge step as completed
    if (!this.tutorialSteps["challenge"]) {
      this.tutorialSteps["challenge"] = true;

      // Increment tutorial step
      this.currentStep++;
      this.updateProgress();

      // If all steps are complete, show completion
      if (this.currentStep >= this.totalSteps && !this.tutorialComplete) {
        this.showTutorialStep("complete");
      }
    }
  }

  private updateProgress(): void {
    // Update progress bar
    this.progressBar.width = (this.currentStep / this.totalSteps) * 200;
    this.progressBar.x = this.cameras.main.width / 2 - 100;

    // Update progress text
    this.progressText.setText(
      `Tutorial Progress: ${this.currentStep}/${this.totalSteps}`
    );
  }

  private handleExit(): void {
    // Transition back to the world map
    this.cameras.main.fade(
      500,
      0,
      0,
      0,
      false,
      (camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress === 1) {
          // Start the world map scene
          this.scene.start("WorldMap", {
            spawnPosition: { x: 150, y: 150 }, // Default spawn position in world map
            coming_from: "TutorialArea",
          });
        }
      }
    );
  }

  private createAmbientEffects(): void {
    // Add some ambient particles for cyberpunk feel
    const particles = this.add.particles(0, 0, "pixel", {
      x: { min: 0, max: this.cameras.main.width },
      y: { min: 0, max: this.cameras.main.height },
      scale: { start: 0.5, end: 0 },
      speed: { min: 10, max: 50 },
      angle: { min: 0, max: 360 },
      blendMode: "ADD",
      lifespan: 2000,
      tint: [0x00f0ff, 0xff00ff, 0x7b61ff],
      quantity: 1,
      frequency: 1000,
    });

    particles.setDepth(5);
    particles.setScrollFactor(0.1); // Parallax effect
  }
}
