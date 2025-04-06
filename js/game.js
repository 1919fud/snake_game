const BOX = 32;
const NumCELLS = {width: 17, height: 15}
const BG_OFFSET = {x: BOX, y: 2*BOX}
const StartGame = {x: BOX*9, y: 10*BOX};
const EndGame = new Event('endgame');
const game = {
	canvas : document.getElementById('game'),
	ctx : null,
	items : [],
	score : 0,
	ground: new Image(),
	dripstoneActive: false,
	dripstoneTimer: 0,
	bonusMultiplier: 1,
	init() {	
		this.ground.src = "img/ground.png";
		this.items.push(new Apple(), new Hamburger(), new dripstone());
		this.ctx = this.canvas.getContext("2d");
	},
	run(){
		this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
		this.ctx.drawImage(this.ground, 0, 0);
		snake.draw(this.ctx);
		for (const item of this.items){
			item.draw(this.ctx);
		}
		this.showScore();
		if(this.dripstoneActive) {
			this.showDripstoneTimer();
		}
	},
	update(){
		snake.update();
		for (let item of this.items){
			item.update();
		}
	},
	showScore(){
		this.ctx.fillStyle = "white";
		this.ctx.font = "50px Arial";
		this.ctx.fillText(this.score, 2*BOX, 1.6*BOX);
		if(this.bonusMultiplier > 1) {
			this.ctx.fillStyle = "yellow";
			this.ctx.font = "20px Arial";
			this.ctx.fillText(`x` + this.bonusMultiplier, 4*BOX, 1.6*BOX);
		}
	},
	showDripstoneTimer(){
		this.ctx.fillStyle = "red";
		this.ctx.font = "20px Arial";
		const timeLeft = Math.floor((10000 - (Date.now() - this.dripstoneTimer)) / 1000);
		this.ctx.fillText(`Dripstone: `+ timeLeft +`s`, 10*BOX, 1.6*BOX);
	},
	activateDripstone(){
		this.dripstoneActive = true;
		this.bonusMultiplier = 2;
		this.dripstoneTimer = Date.now();
		
		this.items = this.items.filter(item => item.type !== 'dripstone');

		for(let i = 0; i < 4; i++) {
			this.items.push(new dripstone(true));
		}

		setTimeout(() => {
			this.dripstoneActive = false;
			this.bonusMultiplier = 1;
			this.items = this.items.filter(item => item.type !== 'dripstone');
			this.items.push(new dripstone(false));
		}, 10000);
	},
	end(){
		clearInterval(stop);
		this.ctx.fillStyle = "white";
		this.ctx.font = "50px Arial";
		this.ctx.fillText("GAME OVER", 5*BOX, 7*BOX);
		this.ctx.fillText("Your score: "+this.score, 5*BOX, 9*BOX);
		this.ctx.fillStyle = "green";
		this.ctx.fillText("Replay", 7*BOX, 11*BOX);
		this.canvas.addEventListener('click',()=>this.replay())
	},
	replay(){
		location.reload()
	}
};

const snake = {
	tail: [{x:StartGame.x, y:StartGame.y}],
	color: 'green',
	draw(ctx){
		for (const cell of this.tail ){
			ctx.fillStyle = this.color;
			ctx.fillRect(cell.x,cell.y,BOX,BOX);  
		}
	},
	update(){
		const newHead = {...this.tail[0]};
		if(this.dir === "left") newHead.x -= BOX;
		if(this.dir === "up") newHead.y -= BOX;
		if(this.dir === "right") newHead.x += BOX;
		if(this.dir === "down") newHead.y += BOX;
		this._checkBoard(newHead);
		if(!this._hasEatenItem(newHead)){this.tail.pop();}
		if(this._hasEatenTail(newHead));
		this.tail.unshift(newHead);
	},
	_hasEatenTail(head){
		for ({x,y}of this.tail){
			if(x === head.x && y === head.y){
				return document.dispatchEvent(EndGame);
			}
		}
		return false;
	},
	_hasEatenItem(head){
		for (let item of game.items){
			if(item.x === head.x && item.y === head.y){
				return item.wasEaten();
			}
		}
	},
	_checkBoard(head){
		if((head.x <= 0 || head.y <= BG_OFFSET.y) || (head.x >= 18*BG_OFFSET.x || head.y >= 9*BG_OFFSET.y )){
			document.dispatchEvent(EndGame);
		}
	}
}

class Item{
	constructor(){
		this._move();
		this.bonus = 0;
		this.grow = false;
		this.img = new Image();
	}
	draw(ctx){
		ctx.drawImage(this.img, this.x, this.y);
	}
	_move(){
		this.x = Math.floor(Math.random()*NumCELLS.width)*BG_OFFSET.x+BG_OFFSET.x;
		this.y = Math.floor(Math.random()*NumCELLS.height)*BG_OFFSET.x+BG_OFFSET.y+BOX;
	}
	wasEaten(){
		this._move();
		game.score += this.bonus * game.bonusMultiplier;
		return this.grow;
	}
	update(){
	}
}

class Apple extends Item{
	constructor(){
		super();
		this.img.src = "img/apple.png";
		this.bonus = 1;
	}
}

class Hamburger extends Item{
	constructor(){
		super();
		this.img.src = "img/hamburger.png";
		this.grow = true;
		this.bonus = 2;
	}
}

class dripstone extends Item{
	constructor(isMoving){
		super();
		this.type = 'dripstone';
		this.img.src = "img/dripstone.png";
		this.isMoving = isMoving;
		this.moveInterval = null;
		if(this.isMoving) {
				this.x = Math.floor(Math.random() * NumCELLS.width) * BG_OFFSET.x + BOX;
				this.y = BG_OFFSET.y;

				this.moveInterval = setInterval(() => {
						this.y += BOX;
						if(this.y >= (NumCELLS.height) * BG_OFFSET.x +BG_OFFSET.y+BOX) {
								this.y = BG_OFFSET.y + BOX;
								this.x = Math.floor(Math.random() * NumCELLS.width) * BG_OFFSET.x + BG_OFFSET.x;
						}}, 75);
		}
	}
	wasEaten(){
		if(this.isMoving) {
			document.dispatchEvent(EndGame);
			return false;
		} else {
			game.activateDripstone();
			return false;
		}
	}
	_move(){
		if(!this.isMoving) {
			super._move();
		} else {
			this.x = Math.floor(Math.random()*NumCELLS.width)*BG_OFFSET.x+BG_OFFSET.x;
			this.y = BG_OFFSET.y + BG_OFFSET.y;
		}
	}
}

// Event
document.addEventListener("keydown", direction);

function direction(event){
	if(event.key === 'ArrowLeft' && snake.dir !== "right")
		snake.dir = "left";
	if(event.key === 'ArrowUp' && snake.dir !== "down")
		snake.dir = "up";
	if(event.key === 'ArrowRight' && snake.dir !== "left")
		snake.dir = "right";
	if(event.key === 'ArrowDown' && snake.dir !== "up")
		snake.dir = "down";
}

document.addEventListener('endgame',()=>game.end())

game.init();
const stop = setInterval(()=>{game.run();game.update()},150);