(() => {
    const PIx2 = Math.PI*2;
    const randomInt = (max) => Math.random()*max | 0;

    class MyWorker
    {
        constructor()
        {
            const me = this;
            this.stars = [];
            this.canvasSize = {width: 100, height: 100};
 
            this.commands = {
                test: () => me.send('test', 'Hello from Worker'),
                setup: (...args) => this.setup(...args),
                resize: (...args) => this.resize(...args),
                default: data => data,
            }
        }
    
        setup({number})
        {
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
    
            stars.forEach(star => {
                star.x += randomInt(11)-5;
                star.y += randomInt(11)-5;
            });
    
            for(let star1 = 0; star1 < stars.length; ++star1)
                for(let star2 = star1+1; star2 < stars.length; ++star2)
                    if( this.getDistance(stars[star1], stars[star2]) < 70)
                        connections.push([star1, star2]);
    
            this.send('update', {stars, connections});
            setTimeout(() => this.update(), 20);
        }
    
        randomStar()
        {
            const {width, height} = this.canvasSize;
            return {x: randomInt(width), y: randomInt(height)};
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
    
        send(cmd, data)
        {
            this.floater.run(cmd, data)
        }

        setFloater(floater)
        {
            this.floater = floater;
        }
    }    

    class Floater
    {
        constructor(myWorker)
        {
            this.stars = [];
            this.connections = [];
            this.commands = {
                test: data => console.log('TEST COMMAND', data),
                update: (...args) => this.onUpdate(...args),
                default: data => data,
            }
            this.mouse = {x: 0, y: 0};
            this.$pointer = document.getElementById('cursor');

            this.canvas = document.getElementById('floater');
            this.ctx = this.canvas.getContext('2d');

            this.worker = myWorker;
            this.worker.setFloater(this);

            window.addEventListener('resize', () => this.onResize());
            window.document.addEventListener('mousemove', e => this.onMouseMove(e));

            this.onResize();

            this.send('setup', {number: 2000, });    
            this.render();        
        }

        run(cmd, data)
        {
            const cmds = this.commands;
            cmds[ cmds[cmd] ? cmd : 'default'](data);
            // console.log('Floater::run', cmd, data);  
        }

        send(cmd, data)
        {
            this.worker.run(cmd, data);
        }

        onUpdate({stars, connections})
        {
            this.stars = stars;
            this.connections = connections;
            // this.render();
        }

        onResize()
        {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.send('resize', {width: this.canvas.width, height: this.canvas.height});
        }

        onMessage(e)
        {
            const {cmd, data} = e.data;
            // console.log('Floater::onMessage', cmd, data);
            this.run(cmd, data);
        }

        onMouseMove({x, y})
        {
            this.mouse = {x, y};
        }
        render()
        {
            const {canvas, ctx, stars, connections} = this;
            // console.log('render', stars);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let star = 0; star < stars.length; star++) {
                const {x, y} = stars[star];
                ctx.fillStyle = "white";

                ctx.beginPath();
                ctx.ellipse(x, y, 3, 3, 0, 0, PIx2);
                ctx.fill();
            }

            // console.log(connections[0]);
            connections.forEach( ([star1, star2]) => {
                const {x: x1, y: y1 } = stars[star1];
                const {x: x2, y: y2} = stars[star2];

                ctx.strokeStyle = "#FFEEEE";

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            });

            this.$pointer.style.left = (this.mouse.x - 10)+'px';
            this.$pointer.style.top = (this.mouse.y - 10)+'px';

            window.requestAnimationFrame( ()=>this.render() );
        }
    }

    window.addEventListener('load', () => {
        if(window.Worker)
        {
            const myWorker = new MyWorker();
            new Floater(myWorker);
        }
    })
})()

