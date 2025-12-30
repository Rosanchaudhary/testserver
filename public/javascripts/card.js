const config = {
  type: Phaser.AUTO,
  width: 300,
  height: 400,
  parent: 'game',
  backgroundColor: '#0b3d2e',
  scene: { create }
};

new Phaser.Game(config);

function create() {
  const centerX = this.cameras.main.centerX;
  const centerY = this.cameras.main.centerY;

  let isFaceUp = false;

  // CARD BACK
  const back = this.add.rectangle(centerX, centerY, 160, 220, 0x1c1c1c)
    .setStrokeStyle(4, 0xffffff)
    .setInteractive({ useHandCursor: true });

  const backText = this.add.text(centerX, centerY, '♠', {
    fontSize: '64px',
    color: '#ffffff'
  }).setOrigin(0.5);

  // CARD FRONT
  const front = this.add.container(centerX, centerY);
  front.setVisible(false);

  const frontBg = this.add.rectangle(0, 0, 160, 220, 0xffffff)
    .setStrokeStyle(4, 0x000000);

  const valueTop = this.add.text(-65, -95, 'A', {
    fontSize: '28px',
    color: '#000'
  });

  const suitTop = this.add.text(-65, -65, '♠', {
    fontSize: '22px',
    color: '#000'
  });

  const suitCenter = this.add.text(0, 0, '♠', {
    fontSize: '64px',
    color: '#000'
  }).setOrigin(0.5);

  const valueBottom = this.add.text(65, 95, 'A', {
    fontSize: '28px',
    color: '#000'
  }).setOrigin(1);

  front.add([frontBg, valueTop, suitTop, suitCenter, valueBottom]);

  // FLIP FUNCTION
  const flipCard = () => {
    this.tweens.add({
      targets: isFaceUp ? front : back,
      scaleX: 0,
      duration: 150,
      onComplete: () => {
        back.setVisible(isFaceUp);
        backText.setVisible(isFaceUp);
        front.setVisible(!isFaceUp);

        this.tweens.add({
          targets: isFaceUp ? back : front,
          scaleX: 1,
          duration: 150
        });

        isFaceUp = !isFaceUp;
      }
    });
  };

  back.on('pointerdown', flipCard);
  frontBg.setInteractive({ useHandCursor: true });
  frontBg.on('pointerdown', flipCard);
}
