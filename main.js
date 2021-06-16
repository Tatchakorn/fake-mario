kaboom({
  global: true,
  fullscreen: true,
  scale: 1,
  debug: true,
  clearColor: [0, 0, 1, 1],
});

const MOVE_SPEED = 120; 
const JUMP_FORCE = 360;
const BIG_JUMP_FORCE = JUMP_FORCE * 1.5;
const ENEMY_SPEED = 20;
let isJumping = true;
let CUR_JUMP_FORCE = JUMP_FORCE;
const FALL_DEATH = 400;

const level_1 = [   
  "                                          ",
  "                                          ",
  "                                          ",
  "                                          ",
  "       %    =*=%=                         ",
  "                                          ",
  "                                 -+       ",
  "                     ^    ^      ()       ",
  "===================================   ====",
];

const level_2 = [   
  "                                          ",
  "                                          ",
  "                                          ",
  "                                          ",
  "       %    =*=%=                         ",
  "                                          ",
  "                                 -+       ",
  "                     ^    ^ ^    ()       ",
  "===================================   ====",
];

const level_3 = [   
  "                                          ",
  "                                          ",
  "                                          ",
  "                                          ",
  "       %    =*=%=                         ",
  "                                          ",
  "                                 -+       ",
  "               $$$$  ^    ^      ()       ",
  "===================================   ====",
];

function big() {
  let timer = 0;
  let isBig = false;
  return {
    update() {
      if (isBig) {
        CUR_JUMP_FORCE = BIG_JUMP_FORCE;
        timer -= dt();
        if(timer <= 0) {
          this.smallify();
        }
      }
    },
    
    isBig() {
      return isBig;
    },

    smallify() {
      CUR_JUMP_FORCE = JUMP_FORCE;
      this.scale = vec2(1);
      timer = 0;
      isBig = false;
    },

    biggify(time) {
      this.scale = vec2(2);
      timer = time;
      isBig = true;
    }
  }
}

loadRoot('./img/')
loadSprite('coin', 'coin.png');
loadSprite('evil-shroom', 'evl-shrm-left.png');
loadSprite('brick', 'brick.png');
loadSprite('block', 'blk.png');
loadSprite('unboxed', 'unboxed.png');
loadSprite('mario', 'mario.png');
loadSprite('mushroom', 'mushroom.png');
loadSprite('surprise', 'surprise-block.png');

loadSprite('pipe-top-left', 'pipe-top-left.png');
loadSprite('pipe-top-right', 'pipe-top-right.png');
loadSprite('pipe-bottom-left', 'pipe-bottom-left.png');
loadSprite('pipe-bottom-right', 'pipe-bottom-right.png');

scene("game", ({level, score }) => {
  layers(['bg', 'obj', 'ui'], 'obj');
  const maps = [level_1, level_2, level_3];

  const levelCfg = {
    width: 20,
    height: 20,
    '=': [sprite('block'), solid() ],
    '$': [sprite('coin'), 'coin'],
    '#': [sprite('mushroom'), solid(), 'mushroom', body()],
    '*': [sprite('surprise'), solid(), 'coin-surprise'],
    '%': [sprite('surprise'), solid(), 'mushroom-surprise'],
    'x': [sprite('unboxed'), solid()],
    '(': [sprite('pipe-bottom-left'), solid(), scale(0.5)],
    ')': [sprite('pipe-bottom-right'), solid(), scale(0.5)],
    '-': [sprite('pipe-top-left'), solid(), scale(0.5), 'pipe'],
    '+': [sprite('pipe-top-right'), solid(), scale(0.5), 'pipe'],
    '^': [sprite('evil-shroom'), solid(), 'dangerous'],
  };

  const gameLevel = addLevel(maps[level], levelCfg);

  const scoreLabel = add([
    text(`score: ${score}`), pos(30, 6),
    layer('ui'), {
      value: score
    }
  ]);

  add([text(`level: ${level+1}`), pos(40,100)]);

  add([
    text('level '+ 'test', pos(4, 6))
  ]);

  const player = add([
    sprite('mario'), solid(),
    pos(30, 0), 
    body(),
    big(),
    origin('bot')
  ]);

  action('mushroom', (m) => {
    m.move(20, 0);
  });


  player.on('headbump', (obj) => {
    if(obj.is('coin-surprise')) {
      gameLevel.spawn('$', obj.gridPos.sub(0, 1));
      destroy(obj);
      gameLevel.spawn('x', obj.gridPos.sub(0, 0));
    }

    if(obj.is('mushroom-surprise')) {
      gameLevel.spawn('#', obj.gridPos.sub(0, 1));
      destroy(obj);
      gameLevel.spawn('x', obj.gridPos.sub(0, 0));
    }
  });

  player.collides('mushroom', (m) => {
    destroy(m);
    player.biggify(6);
  });

  player.collides('coin', (c) => {
    destroy(c);
    scoreLabel.value++;
    scoreLabel.text = scoreLabel.value;
  });

  player.collides('dangerous', (d) => {
    if(isJumping) {
      destroy(d);
    } else {
      go('lose', { score: scoreLabel.value });
    }
  });

  action('dangerous', (d) => {
    d.move(-ENEMY_SPEED, 0)
  });

  keyDown('left', () => {
    player.move(-MOVE_SPEED, 0);
  });

  keyDown('right', () => {
    player.move(MOVE_SPEED, 0);
  });

  player.action(() => {
    if(player.grounded()) {
      isJumping = false;
    }
  });

  player.action(() => {
    camPos(player.pos); 
    if (player.pos.y > FALL_DEATH) {
      go('lose', { score: scoreLabel.value });
    }
  });

  player.collides('pipe', () => {
    keyPress('down', () => {
      go('game', {
        level: (level + 1),
        score: scoreLabel.value
      });
    });
  });

  keyPress('space', () => {

    if(player.grounded()) {
      isJumping = true;
      player.jump(CUR_JUMP_FORCE);

    }
  });
});


scene('lose', ({ score }) => {
  add([text(score, 32), origin('center'), pos(width()/2, height()/2)]);
});

start('game', {level:0, score: 0});

