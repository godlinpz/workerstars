const randomInt = (max) => Math.random()*max | 0;
const randomIntFromRange = (min, max) => randomInt(max - min) + min;

class MyWorker
{
    constructor()
    {
        const me = this;
        this.stars = [];
        this.canvasSize = {width: 100, height: 100};
        this.mousePos = {x: 0, y: 0};
        this.options = {
            udpatePeriod: 20,
            linkDistance: 70,
            minSpeed: 1,
            maxSpeed: 10,
            minDestinationDelta: 50,
            maxDestinationDelta: 370,
        }

        this.commands = {
            test: () => me.send('test', 'Hello from Worker'),
            setup: (...args) => this.setup(...args),
            resize: (...args) => this.resize(...args),
            mouse: (...args) => this.mouse(...args),
            default: data => data,
        }
    }

    setup({number, options})
    {
        Object.assign(this.options, options || {})
        this.stars = [];
        const stars = this.stars;

        for(let i=0; i<number; ++i)
            stars[i] = this.randomStar();

        this.update();
    }

    getDistance(a, b)
    {
        // console.log(a, b)
        return Math.sqrt( (b.x - a.x)**2 + (b.y - a.y)**2 );
    }

    update()
    {
        const {stars} = this;
        const connections = [];
        const currTime = performance.now();
        const {width, height} = this.canvasSize;
         

        stars.forEach(star => {
            const {dx, dy, toX, toY, time, speed} = star;
            const coeff = (currTime - time)/ 1000 / speed ;
            if(coeff > 1)
            {
                star.x = toX;
                star.y = toY;
                this.randomDestination(star);
            }
            else
            {
                star.x = toX - dx * (1 - coeff);
                star.y = toY - dy * (1 - coeff);
            }
            star.x = (star.x + width) % width;
            star.y = (star.y + height) % height;
        });

        for(let star1 = 0; star1 < stars.length; ++star1)
            for(let star2 = star1+1; star2 < stars.length; ++star2)
                if( this.getDistance(stars[star1], stars[star2]) < this.options.linkDistance
                    && this.getDistance(stars[star1], this.mousePos) > 150
                    && this.getDistance(stars[star2], this.mousePos) > 150
                )
                    connections.push([star1, star2]);

        this.send('update', {stars, connections});
        setTimeout(() => this.update(), this.options.udpatePeriod);
    }

    randomDestination(star)
    {
        const {x, y} = star;
        const {width, height} = this.canvasSize;
        const {minDestinationDelta: minD, maxDestinationDelta: maxD, minSpeed, maxSpeed } = this.options;
        

        const toX = randomIntFromRange(x-maxD, x+maxD);
        const toY = randomIntFromRange(y-maxD, y+maxD);

        Object.assign(star, {
            dx: toX - x,
            dy: toY - y,
            toX,
            toY,
            time: performance.now() | 0,
            speed: randomIntFromRange(minSpeed, maxSpeed),

        })

        return star;
    }

    randomStarColor(maxZ, z, step = 32)
    {
        return Number(255 - randomInt(maxZ - z + 1)*step).toString(16);
    }

    randomStar()
    {
        const {width, height} = this.canvasSize;
        const star = {x: randomInt(width), y: randomInt(height), z: randomInt(4)}
        star.color = [40,40,40,16].reduce((color, step) => color += this.randomStarColor(3, 0, step), '#');
        return this.randomDestination(star);
    }

    run(cmd, data)
    {
        const cmds = this.commands;
        cmds[ cmds[cmd] ? cmd : 'default'](data);
        // console.log('Worker::run', cmd, data);  
    }

    resize(size)
    {
        this.canvasSize = size;
    }

    mouse(mousePos)
    {
        this.mousePos = mousePos;
    }

    send(cmd, data)
    {
        self.postMessage({cmd, data});
    }
}

const myWorker = new MyWorker();

self.addEventListener('message', function(e) {
    myWorker.run(e.data.cmd, e.data.data)
})