(() => {
    const PIx2 = Math.PI*2;
    class Floater
    {
        constructor()
        {
            this.stars = [];
            this.connections = [];
            this.mouse = {x: 0, y: 0};

            this.commands = {
                test: data => console.log('TEST COMMAND', data),
                update: (...args) => this.onUpdate(...args),
                default: data => data,
            }

            this.canvas = document.getElementById('floater');
            this.ctx = this.canvas.getContext('2d');
            this.$pointer = document.getElementById('cursor');

            this.worker = new Worker('floater_worker.js');
            this.worker.addEventListener('message', (...args) => this.onMessage(...args), false);

            window.addEventListener('resize', () => this.onResize());
            window.document.addEventListener('mousemove', e => this.onMouseMove(e));

            this.onResize();

            this.options = {
                udpatePeriod: 50,
                linkDistance: 60,
                number: (this.canvas.width / 40 | 0) * (this.canvas.height / 40 | 0),
                maxStarSize: 8,

                minSpeed: 2,
                maxSpeed: 8,
                minDestinationDelta: 50,
                maxDestinationDelta: 270,
            }

            this.send('setup', {number: this.options.number, options: this.options});    
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
            this.worker.postMessage({cmd, data});
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
            this.send('mouse', {x, y});
        }
        render()
        {
            const {canvas, ctx, stars, connections, options: {maxStarSize}} = this;
            // console.log('render', stars);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // console.log(connections[0]);
            connections.forEach( ([star1, star2]) => {
                const {x: x1, y: y1 } = stars[star1];
                const {x: x2, y: y2} = stars[star2];

                ctx.strokeStyle = "#FFEEEE66";

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            });

            for (let star = 0; star < stars.length; star++) {
                const {x, y, z, color} = stars[star];

                ctx.fillStyle = star % 50 ? color: 'red';
                const radius = star % 50 ? maxStarSize/4 * z : 8;

                ctx.beginPath();
                ctx.ellipse(x, y, radius, radius, 0, 0, PIx2);
                ctx.fill();
            }

            this.$pointer.style.left = (this.mouse.x - 10)+'px';
            this.$pointer.style.top = (this.mouse.y - 10)+'px';

            window.requestAnimationFrame( ()=>this.render() );
        }
    }

    window.addEventListener('load', () => {
        if(window.Worker)
        {
            new Floater();
        }
    })
})()

