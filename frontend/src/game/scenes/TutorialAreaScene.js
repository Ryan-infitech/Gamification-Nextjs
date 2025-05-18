import Phaser from "phaser";

export default class TutorialAreaScene extends Phaser.Scene {
  constructor() {
    super({ key: "TutorialAreaScene" });

    // State tracking
    this.player = null;
    this.cursors = null;
    this.interactKey = null;
    this.spawnPoints = [];
    this.currentSpawnIndex = 0;
    this.interactableObjects = {};
    this.collisionLayer = null;
    this.dialogBox = null;
    this.isDialogActive = false;
    this.objectsLayer = null;
    this.currentObjective = "Find the tutor NPC";

    // Tutorial state
    this.tutorialCompleted = false;
    this.interactionsCompleted = new Set();
  }

  init(data) {
    this.gameData = data.gameData || this.registry.get("gameData") || {};
    this.tutorialCompleted = this.gameData.hasCompletedTutorial || false;
  }

  preload() {
    // Any last-minute loading needed for the scene
  }

  create() {
    // Create world map
    this.createMap();

    // Create player
    this.createPlayer();

    // Set up input
    this.setupInput();

    // Create camera follow
    this.setupCamera();

    // Create UI
    this.createUI();

    // Add tutorial dialog
    if (!this.tutorialCompleted) {
      this.time.delayedCall(1000, () => {
        this.showDialog("Welcome to CodeQuest Pixels tutorial area!", "Guide", [
          "Use arrow keys or WASD to move.",
          "Press E to interact with people and objects.",
          "Complete the tutorial by following the objectives.",
        ]);
      });
    }

    // Play tutorial area music
    if (this.sound.get("main-theme")?.isPlaying) {
      this.sound.get("main-theme").stop();
    }

    if (!this.sound.get("tutorial-theme")) {
      this.sound.add("tutorial-theme", { loop: true, volume: 0.4 }).play();
    }
  }

  createMap() {
    // Create tilemap from the loaded JSON file
    this.map = this.make.tilemap({ key: "map-prototype" });

    // Add tilesets to the map
    const natureTileset = this.map.addTilesetImage(
      "Robot_Warfare_tileset_arranged",
      "nature-tileset"
    );
    const platformTileset = this.map.addTilesetImage(
      "Robot_Warfare_obstacles-and-objects",
      "platform-tileset"
    );
    const interiorTileset = this.map.addTilesetImage(
      "pixel-cyberpunk-interior",
      "interior-tileset"
    );
    const waterTileset = this.map.addTilesetImage("Water", "water-tileset");
    const buildingTileset = this.map.addTilesetImage(
      "building",
      "buildings-tileset"
    );
    const plantTileset = this.map.addTilesetImage(
      "Basic_TX Plant",
      "plant-tileset"
    );
    const plant32Tileset = this.map.addTilesetImage(
      "Basic_TX Plant32",
      "plant-tileset-32"
    );

    // Create the tilemap layers in the correct order
    // Base layer
    this.map.createLayer("Base_Terrain", [natureTileset, waterTileset]);

    // Middle layers
    this.map.createLayer("Terrain_Detail", [
      natureTileset,
      platformTileset,
      interiorTileset,
    ]);
    this.map.createLayer("Paths", [natureTileset, platformTileset]);
    this.map.createLayer("Deco_Lower", [
      natureTileset,
      platformTileset,
      plantTileset,
      plant32Tileset,
    ]);

    // Upper decoration layers
    const upperLayer = this.map.createLayer("Deco_Upper", [
      natureTileset,
      platformTileset,
      plantTileset,
      interiorTileset,
    ]);
    const buildingsLayer = this.map.createLayer("Buildings&wall", [
      natureTileset,
      platformTileset,
      buildingTileset,
    ]);
    const upperV2Layer = this.map.createLayer("Deco_UpperV2", [
      natureTileset,
      platformTileset,
      interiorTileset,
    ]);
    const upperV3Layer = this.map.createLayer("Deco_UpperV3", [
      natureTileset,
      platformTileset,
      interiorTileset,
    ]);

    // Set depth for upper layers so they render above the player
    upperLayer.setDepth(10);
    buildingsLayer.setDepth(10);
    upperV2Layer.setDepth(10);
    upperV3Layer.setDepth(10);

    // Set up collision - get the collision layer from objects
    this.setUpCollision();

    // Create spawn points and interactive objects
    this.createInteractiveObjects();

    // Create finish area
    this.createFinishArea();
  }

  setUpCollision() {
    // Create collision layer from the objects
    this.colliders = this.physics.add.group({ immovable: true });

    // Find the collision layer from the map's object layers
    const collisionLayer = this.map.getObjectLayer("Collision");

    if (collisionLayer && collisionLayer.objects) {
      // Create static physics bodies for collision objects
      collisionLayer.objects.forEach((object) => {
        // Rectangle collision bodies
        if (object.rectangle) {
          const rect = this.add.rectangle(
            object.x + object.width / 2,
            object.y + object.height / 2,
            object.width,
            object.height
          );
          this.physics.add.existing(rect, true);
          this.colliders.add(rect);
          rect.alpha = 0; // Make invisible
        }
        // Polygon collision bodies
        else if (object.polygon) {
          // Create polygon body - this would require additional code for polygons
          console.log("Polygon colliders not implemented yet");
        }
      });
    } else {
      console.warn("No collision layer found in the map!");
    }
  }

  createInteractiveObjects() {
    // Find the interactables and spawn object layers
    const interactablesLayer = this.map.getObjectLayer("Interactables");
    const spawnLayer = this.map.getObjectLayer("Spawn");

    // Process spawn points
    if (spawnLayer && spawnLayer.objects) {
      spawnLayer.objects.forEach((spawnPoint) => {
        // Sort spawn points by their order (if specified)
        const spawnOrder =
          spawnPoint.properties?.find((p) => p.name === "Spawnorder")?.value ||
          1;

        this.spawnPoints.push({
          x: spawnPoint.x,
          y: spawnPoint.y,
          order: spawnOrder,
        });
      });

      // Sort spawn points by order
      this.spawnPoints.sort((a, b) => a.order - b.order);
    }

    // Process interactable objects
    if (interactablesLayer && interactablesLayer.objects) {
      interactablesLayer.objects.forEach((obj) => {
        // Get object properties
        const properties = {};
        if (obj.properties) {
          obj.properties.forEach((prop) => {
            properties[prop.name] = prop.value;
          });
        }

        // Create sprite for the interactable object
        const sprite = this.physics.add
          .sprite(obj.x, obj.y, "chest")
          .setOrigin(0.5, 1);

        // Set interactable object properties
        sprite.interactionId = obj.id;
        sprite.interactionOrder = properties.interactionorder || 0;
        sprite.interactionType = properties.type || "chest";
        sprite.interactionText = properties.text || "Press E to interact";

        // Add to tracking object
        this.interactableObjects[obj.id] = {
          sprite,
          properties,
          interacted: false,
        };

        // Add interaction indicator above the object
        const indicator = this.add
          .sprite(obj.x, obj.y - 40, "coin-icon")
          .setScale(0.5)
          .setAlpha(0.8);

        // Add floating animation
        this.tweens.add({
          targets: indicator,
          y: obj.y - 45,
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });

        // Store indicator reference
        this.interactableObjects[obj.id].indicator = indicator;
      });
    }
  }

  createFinishArea() {
    // Find the finish object layer
    const finishLayer = this.map.getObjectLayer("Finish");

    if (finishLayer && finishLayer.objects && finishLayer.objects.length > 0) {
      const finishPoint = finishLayer.objects[0];

      // Create finish area marker
      const finishMarker = this.add
        .sprite(finishPoint.x, finishPoint.y, "door")
        .setOrigin(0.5, 1);

      // Create physics trigger zone
      const finishZone = this.add.zone(
        finishPoint.x,
        finishPoint.y - 16,
        64,
        64
      );
      this.physics.world.enable(finishZone);

      // Check for player collision with finish zone
      this.physics.add.overlap(
        this.player,
        finishZone,
        this.handleFinishArea,
        null,
        this
      );

      // Add visual indicator for the finish area
      const indicator = this.add
        .sprite(finishPoint.x, finishPoint.y - 64, "xp-icon")
        .setScale(0.8)
        .setAlpha(0.8);

      // Add floating animation
      this.tweens.add({
        targets: indicator,
        y: finishPoint.y - 70,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  createPlayer() {
    // Use the first spawn point (or a default if none found)
    const spawn =
      this.spawnPoints.length > 0
        ? this.spawnPoints[this.currentSpawnIndex]
        : { x: this.map.widthInPixels / 2, y: this.map.heightInPixels / 2 };

    // Create player sprite
    this.player = this.physics.add
      .sprite(spawn.x, spawn.y, "player")
      .setSize(20, 20) // Adjust collision box size
      .setOffset(6, 12) // Adjust collision box position
      .setDepth(5); // Set depth so player appears above most layers

    // Set up collision between player and colliders
    this.physics.add.collider(this.player, this.colliders);

    // Set up interaction with interactable objects
    Object.values(this.interactableObjects).forEach((obj) => {
      this.physics.add.overlap(
        this.player,
        obj.sprite,
        () => this.handleInteraction(obj),
        null,
        this
      );
    });

    // Play idle animation
    this.player.play("player-idle");
  }

  setupInput() {
    // Create cursor keys
    this.cursors = this.input.keyboard.createCursorKeys();

    // Create additional keys
    this.interactKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.E
    );
    this.wasdKeys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // Dialog advancement key
    this.input.keyboard.on("keydown-SPACE", () => {
      if (this.isDialogActive) {
        this.advanceDialog();
      }
    });
  }

  setupCamera() {
    // Set bounds to the map size
    this.cameras.main.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );

    // Set camera to follow player
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Set zoom level
    this.cameras.main.setZoom(1.5);
  }

  createUI() {
    // Create UI container that follows the camera
    this.uiContainer = this.add.container(0, 0);
    this.uiContainer.setScrollFactor(0);

    // Get camera dimensions
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Add objective text
    this.objectiveText = this.add.text(
      10,
      10,
      `Objective: ${this.currentObjective}`,
      {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      }
    );
    this.objectiveText.setScrollFactor(0);

    // Create dialog box (hidden by default)
    this.createDialogBox();

    // Create interaction prompt (hidden by default)
    this.interactionPrompt = this.add
      .text(width / 2, height - 50, "Press E to interact", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
        backgroundColor: "#00000088",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setVisible(false);
  }

  createDialogBox() {
    // Get camera dimensions
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create dialog container
    this.dialogBox = this.add.container(width / 2, height - 120);
    this.dialogBox.setScrollFactor(0).setAlpha(0).setVisible(false);

    // Dialog background
    const background = this.add
      .image(0, 0, "dialog-box")
      .setOrigin(0.5, 0.5)
      .setDisplaySize(width - 40, 100);

    // Speaker name background
    const nameBox = this.add
      .rectangle(-width / 2 + 100, -40, 140, 30, 0x222222, 0.8)
      .setOrigin(0.5, 0.5)
      .setStrokeStyle(2, 0xffffff);

    // Speaker name text
    this.speakerText = this.add
      .text(-width / 2 + 100, -40, "Speaker", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0.5);

    // Dialog content text
    this.dialogText = this.add
      .text(0, 0, "", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
        wordWrap: { width: width - 80 },
      })
      .setOrigin(0.5, 0.5);

    // Continue prompt
    this.continuePrompt = this.add
      .text(width / 2 - 80, 35, "Press SPACE to continue", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#ffff00",
      })
      .setOrigin(0.5, 0.5);

    // Add blinking animation to continue prompt
    this.tweens.add({
      targets: this.continuePrompt,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Add all elements to the dialog container
    this.dialogBox.add([
      background,
      nameBox,
      this.speakerText,
      this.dialogText,
      this.continuePrompt,
    ]);

    // Dialog state
    this.dialogQueue = [];
    this.currentDialogIndex = 0;
  }

  update() {
    if (!this.player) return;

    // Only handle player movement if dialog isn't active
    if (!this.isDialogActive) {
      this.handlePlayerMovement();
      this.handlePlayerInteraction();
    }

    // Update interaction prompt position if needed
    this.updateInteractionPrompt();
  }

  handlePlayerMovement() {
    // Reset velocity
    this.player.setVelocity(0);

    const speed = 150;
    let moving = false;

    // Combine cursor keys and WASD
    const left = this.cursors.left.isDown || this.wasdKeys.left.isDown;
    const right = this.cursors.right.isDown || this.wasdKeys.right.isDown;
    const up = this.cursors.up.isDown || this.wasdKeys.up.isDown;
    const down = this.cursors.down.isDown || this.wasdKeys.down.isDown;

    // Handle horizontal movement
    if (left) {
      this.player.setVelocityX(-speed);
      this.player.play("player-walk-left", true);
      moving = true;
    } else if (right) {
      this.player.setVelocityX(speed);
      this.player.play("player-walk-right", true);
      moving = true;
    }

    // Handle vertical movement
    if (up) {
      this.player.setVelocityY(-speed);
      // Only play up animation if not moving horizontally
      if (!moving) {
        this.player.play("player-walk-up", true);
        moving = true;
      }
    } else if (down) {
      this.player.setVelocityY(speed);
      // Only play down animation if not moving horizontally
      if (!moving) {
        this.player.play("player-walk-down", true);
        moving = true;
      }
    }

    // Play idle animation if not moving
    if (!moving) {
      this.player.play("player-idle", true);
    }

    // Normalize diagonal movement
    this.player.body.velocity.normalize().scale(speed);
  }

  handlePlayerInteraction() {
    // Check for interaction key press
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      // Find closest interactable object that overlaps with player
      let closestDistance = Infinity;
      let closestObject = null;

      Object.values(this.interactableObjects).forEach((obj) => {
        // Check if player is overlapping with this object
        const distance = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          obj.sprite.x,
          obj.sprite.y
        );

        // If closer than previous closest and within range
        if (distance < closestDistance && distance < 50) {
          closestDistance = distance;
          closestObject = obj;
        }
      });

      // Interact with the closest object if found
      if (closestObject) {
        this.interactWithObject(closestObject);
      }
    }
  }

  handleInteraction(object) {
    // Show interaction prompt when near an object
    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      object.sprite.x,
      object.sprite.y
    );

    if (distance < 50) {
      this.showInteractionPrompt(object.sprite.interactionText);
    } else {
      this.hideInteractionPrompt();
    }
  }

  interactWithObject(object) {
    // Don't allow interaction if already interacted with this object
    if (object.interacted) return;

    // Mark as interacted
    object.interacted = true;
    this.interactionsCompleted.add(object.sprite.interactionId);

    // Hide the indicator
    if (object.indicator) {
      object.indicator.destroy();
    }

    // Play interaction animation or sound
    this.sound.play("click");

    // Show appropriate dialog based on the object
    if (object.sprite.interactionType === "npc") {
      this.showDialog(
        "Welcome to the tutorial! I'll teach you the basics of coding while you explore.",
        "Tutor",
        [
          "First, let's learn about variables. They store values that can change.",
          'For example: let score = 0; creates a variable named "score" with a value of 0.',
          "Now go find the next checkpoint to continue learning!",
        ]
      );
    } else if (object.sprite.interactionType === "chest") {
      // Play chest opening animation
      object.sprite.play("chest-open");

      // Add coins to player
      const coinsGained = Phaser.Math.Between(5, 20);

      // Update game data
      if (!this.gameData.user) this.gameData.user = {};
      if (!this.gameData.user.coins) this.gameData.user.coins = 0;
      this.gameData.user.coins += coinsGained;

      // Update registry
      this.registry.set("gameData", this.gameData);

      // Show dialog
      this.showDialog(`You found ${coinsGained} coins!`, "Treasure Chest", [
        "These coins can be used to buy upgrades in the shop.",
      ]);

      // Play sound effect
      this.sound.play("coin-collect");
    }

    // Check if all required interactions are complete
    this.checkProgressionState();
  }

  checkProgressionState() {
    // Count completed interactions
    const completedCount = this.interactionsCompleted.size;
    const totalInteractions = Object.keys(this.interactableObjects).length;

    // Update objective text
    if (completedCount === totalInteractions) {
      this.currentObjective = "Go to the exit door";
      this.objectiveText.setText(`Objective: ${this.currentObjective}`);

      // Highlight the finish area
      const finishLayer = this.map.getObjectLayer("Finish");
      if (
        finishLayer &&
        finishLayer.objects &&
        finishLayer.objects.length > 0
      ) {
        const finishPoint = finishLayer.objects[0];

        // Create a pulsing circle at the finish point
        const highlight = this.add.circle(
          finishPoint.x,
          finishPoint.y - 32,
          32,
          0xffff00,
          0.3
        );

        // Add pulsing animation
        this.tweens.add({
          targets: highlight,
          alpha: { from: 0.3, to: 0.6 },
          scale: { from: 1, to: 1.5 },
          duration: 1000,
          yoyo: true,
          repeat: -1,
        });
      }
    } else {
      this.currentObjective = `Interact with objects (${completedCount}/${totalInteractions})`;
      this.objectiveText.setText(`Objective: ${this.currentObjective}`);
    }
  }

  handleFinishArea() {
    // Only allow finishing if all interactions are completed
    const completedCount = this.interactionsCompleted.size;
    const totalInteractions = Object.keys(this.interactableObjects).length;

    if (completedCount >= totalInteractions) {
      // Mark tutorial as completed
      this.gameData.hasCompletedTutorial = true;
      this.registry.set("gameData", this.gameData);

      // Award XP for completing tutorial
      if (!this.gameData.user) this.gameData.user = {};
      if (!this.gameData.user.xp) this.gameData.user.xp = 0;

      const xpGained = 100;
      this.gameData.user.xp += xpGained;

      // Update level if needed
      if (!this.gameData.user.level) this.gameData.user.level = 1;
      const newLevel = Math.floor(this.gameData.user.xp / 100) + 1;

      if (newLevel > this.gameData.user.level) {
        this.gameData.user.level = newLevel;

        // Show level up message
        this.showDialog(
          `Congratulations! You've reached level ${newLevel}!`,
          "Level Up",
          [
            `You gained ${xpGained} XP for completing the tutorial.`,
            "Now you can access the World Map and start your real adventure!",
            "Press SPACE to continue to the World Map.",
          ],
          () => {
            // Transition to the world map
            this.scene.start("WorldMapScene", { gameData: this.gameData });
          }
        );
      } else {
        // Show completion message
        this.showDialog(
          "Congratulations! You've completed the tutorial!",
          "Tutorial Complete",
          [
            `You gained ${xpGained} XP for completing the tutorial.`,
            "Now you can access the World Map and start your real adventure!",
            "Press SPACE to continue to the World Map.",
          ],
          () => {
            // Transition to the world map
            this.scene.start("WorldMapScene", { gameData: this.gameData });
          }
        );
      }

      // Update registry one more time with the new data
      this.registry.set("gameData", this.gameData);
    } else {
      // Show message that they need to complete all interactions
      this.showDialog(
        "You haven't interacted with all the objects yet!",
        "Tutorial",
        [
          `You've interacted with ${completedCount} out of ${totalInteractions} objects.`,
          "Find and interact with all objects before proceeding.",
        ]
      );
    }
  }

  showInteractionPrompt(text = "Press E to interact") {
    this.interactionPrompt.setText(text);
    this.interactionPrompt.setVisible(true);
  }

  hideInteractionPrompt() {
    this.interactionPrompt.setVisible(false);
  }

  updateInteractionPrompt() {
    // Always position the prompt at the bottom of the screen
    if (this.interactionPrompt.visible) {
      const width = this.cameras.main.width;
      const height = this.cameras.main.height;

      this.interactionPrompt.setPosition(width / 2, height - 50);
    }
  }

  showDialog(message, speaker = "NPC", dialogQueue = [], callback = null) {
    // Set dialog content
    this.dialogText.setText(message);
    this.speakerText.setText(speaker);

    // Store dialog queue
    this.dialogQueue = dialogQueue;
    this.currentDialogIndex = 0;
    this.dialogCallback = callback;

    // Make dialog visible and animate it in
    this.dialogBox.setVisible(true);
    this.isDialogActive = true;

    // Fade in animation
    this.tweens.add({
      targets: this.dialogBox,
      alpha: { from: 0, to: 1 },
      y: {
        from: this.cameras.main.height - 80,
        to: this.cameras.main.height - 120,
      },
      duration: 300,
      ease: "Power2",
    });
  }

  advanceDialog() {
    // If there are more dialog messages in the queue
    if (this.currentDialogIndex < this.dialogQueue.length) {
      // Show the next message
      this.dialogText.setText(this.dialogQueue[this.currentDialogIndex]);
      this.currentDialogIndex++;
    } else {
      // No more messages, close dialog
      this.closeDialog();
    }
  }

  closeDialog() {
    // Animate dialog closing
    this.tweens.add({
      targets: this.dialogBox,
      alpha: { from: 1, to: 0 },
      y: {
        from: this.cameras.main.height - 120,
        to: this.cameras.main.height - 80,
      },
      duration: 200,
      ease: "Power2",
      onComplete: () => {
        this.dialogBox.setVisible(false);
        this.isDialogActive = false;

        // Call the callback if provided
        if (this.dialogCallback && typeof this.dialogCallback === "function") {
          this.dialogCallback();
          this.dialogCallback = null;
        }
      },
    });
  }
}
