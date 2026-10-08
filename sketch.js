/*
Pelotita Loca:
- se mueve sola y rebota en los cuatro bordes de la pantalla
- a veces rebota alto y a veces bajo, y cambia de tamaño y color en cada rebote
- cada rebote suena (p5.sound.js)
- va dejando un halo con su rastro
- se detiene si le posás el cursor encima
- cuadrícula blanca de fondo y partículas que salen del mouse (viven 7 segundos)
*/

let posX, posY;      // centro de la pelota
let velX, velY;      // velocidad en píxeles por cuadro
const diametroMin = 20;
const diametroMax = 110;
let diametro = 50;
const velMax = 22;      // tope de velocidad
const gravedad = 0.5;

const fondo = [18, 18, 26];      // negro un poco más claro (con un dejo azulado)
const morado = [138, 43, 226];   // un color de la pelota al rebotar
const fucsia = [255, 0, 255];    // fucsia eléctrico
const turquesa = [0, 255, 200];  // turquesa eléctrico
let colorPelota = [255, 50, 200];

const pasoCuadricula = 50;       // separación de la cuadrícula arcade

const VIDA_PARTICULA = 7000;     // las partículas viven 7 segundos
let particulas = [];
let ultimoSpawn = 0;
let mouseEnCanvas = false;

let capa;            // capa transparente donde vive el rastro (pelota + partículas)

let osc, env;        // sonido del rebote
let audioListo = false;   // el audio arranca con el primer gesto del usuario

function setup() {
    createCanvas(windowWidth, windowHeight);
    capa = createGraphics(width, height);

    posX = width / 2;
    posY = height / 3;
    velX = random([-1, 1]) * random(3, 6);
    velY = 0;
    colorPelota = random([morado, fucsia, turquesa]);

    // Oscilador + envolvente: cada rebote dispara un "blip" corto.
    // El navegador no deja sonar hasta que el usuario interactúa,
    // por eso el oscilador arranca recién en activarAudio().
    osc = new p5.Oscillator("triangle");
    env = new p5.Envelope(0.005, 0.1, 0.3, 0.2);
    osc.disconnect();       // saca el tono continuo de la salida
    osc.connect(env);       // y lo hace pasar por la envolvente
    // No arrancamos el oscilador acá: el navegador tiene el audio bloqueado
    // hasta que el usuario interactúa, así que lo hacemos en activarAudio().

    // Además de los eventos de p5, escuchamos gestos nativos por las dudas.
    window.addEventListener("pointerdown", activarAudio);
    window.addEventListener("keydown", activarAudio);
    window.addEventListener("touchstart", activarAudio);
}

function activarAudio() {
    userStartAudio();               // reanuda el AudioContext del navegador
    if (!audioListo) {
        osc.start();                // recién ahora el oscilador va a sonar
        audioListo = true;
    }
}

function draw() {
    // Fondo opaco + cuadrícula: así la cuadrícula queda a su opacidad real.
    background(fondo[0], fondo[1], fondo[2]);
    dibujarCuadricula();

    // Si el cursor está encima de la pelota, se detiene.
    const sobreLaPelota = dist(mouseX, mouseY, posX, posY) < diametro / 2;

    if (!sobreLaPelota) {
        moverPelota();
    }

    // La capa del rastro se desvanece un poco cada cuadro.
    capa.erase(28);
    capa.rect(0, 0, width, height);
    capa.noErase();

    // La pelota y las partículas se dibujan en la capa (por eso dejan rastro).
    actualizarParticulas();
    dibujarPelota();

    // Se compone el rastro sobre el fondo + cuadrícula.
    image(capa, 0, 0);

    if (sobreLaPelota) {
        // marca visual de que está detenida (no deja rastro)
        noFill();
        stroke(210, 180, 240);
        circle(posX, posY, diametro + 12);
    }

    if (!audioListo) {
        // aviso hasta que el usuario habilite el sonido
        fill(235);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(16);
        text("Haz clic para activar el sonido", width / 2, height / 2 + 70);
    }
}

function dibujarCuadricula() {
    // cuadrícula blanca, sutil (15% de opacidad)
    stroke(255, 255, 255, 38);
    strokeWeight(1);
    for (let x = 0; x <= width; x += pasoCuadricula) line(x, 0, x, height);
    for (let y = 0; y <= height; y += pasoCuadricula) line(0, y, width, y);
}

function crearParticula(x, y) {
    particulas.push({
        x: x + random(-6, 6),
        y: y + random(-6, 6),
        vx: random(-1.6, 1.6),
        vy: random(-2.6, 0.6),
        tamano: random(4, 12),
        nacimiento: millis(),
        color: random([fucsia, turquesa, morado, [255, 255, 255]]),
    });
}

function actualizarParticulas() {
    const ahora = millis();

    // emite desde la posición del mouse
    if (mouseEnCanvas && ahora - ultimoSpawn > 35) {
        ultimoSpawn = ahora;
        crearParticula(mouseX, mouseY);
        if (random() < 0.5) crearParticula(mouseX, mouseY);
    }

    // actualiza y dibuja en la capa del rastro
    capa.noStroke();
    for (let i = particulas.length - 1; i >= 0; i--) {
        const p = particulas[i];
        const edad = ahora - p.nacimiento;
        if (edad >= VIDA_PARTICULA) {   // vivió sus 7 segundos: se va
            particulas.splice(i, 1);
            continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03;         // caen apenas
        p.vx *= 0.995;
        p.vy *= 0.995;

        const t = edad / VIDA_PARTICULA;   // 0 -> 1 durante toda su vida
        capa.fill(p.color[0], p.color[1], p.color[2], 255 * (1 - t));
        capa.circle(p.x, p.y, p.tamano * (1 - 0.6 * t));
    }
}

function dibujarPelota() {
    capa.noStroke();
    // halo suave que acompaña a la pelota
    capa.fill(colorPelota[0], colorPelota[1], colorPelota[2], 30);
    capa.circle(posX, posY, diametro * 1.7);
    // la pelota
    capa.fill(colorPelota);
    capa.circle(posX, posY, diametro);
}

function mouseMoved() {
    mouseEnCanvas = true;
}

function moverPelota() {
    posX += velX;
    posY += velY;
    velY += gravedad;

    const r = diametro / 2;

    // --- rebotes en los bordes laterales ---
    if (posX < r) {
        posX = r;
        velX = abs(velX) * random(0.75, 1.15);   // a veces pierde, a veces gana
        velY += random(-1, 1);
        rebotar();
    } else if (posX > width - r) {
        posX = width - r;
        velX = -abs(velX) * random(0.75, 1.15);
        velY += random(-1, 1);
        rebotar();
    }

    // --- rebotes arriba y abajo ---
    if (posY < r) {
        posY = r;
        velY = abs(velY) * random(0.8, 1.15);
        rebotar();
    } else if (posY > height - r) {
        posY = height - r;
        velY = -abs(velY) * random(0.8, 1.15);
        // si perdió casi toda la energía, le damos un empujón al azar
        if (abs(velY) < 3.5) {
            velY = -random(8, 14);
        }
        rebotar();
    }

    // que la velocidad horizontal no se apague del todo...
    if (abs(velX) < 1.5) {
        velX = (velX < 0 ? -1 : 1) * random(2, 5);
    }
    // ...ni se convierta en un misil
    velX = constrain(velX, -velMax, velMax);
    velY = constrain(velY, -velMax, velMax);
}

function cambiarTamano() {
    // a veces crece, a veces se achica
    diametro = constrain(diametro * random(0.75, 1.25), diametroMin, diametroMax);
    // con el tamaño nuevo, que no quede fuera de la pantalla
    posX = constrain(posX, diametro / 2, width - diametro / 2);
    posY = constrain(posY, diametro / 2, height - diametro / 2);
}

function cambiarColor() {
    // entre morado y fucsia eléctrico
    colorPelota = random([morado, fucsia, turquesa]);
}

function rebotar() {
    cambiarTamano();           // cada rebote cambia el tamaño de la pelota
    cambiarColor();            // ...y también el color
    if (!audioListo) return;   // todavía no hay audio habilitado
    // cada rebote suena distinto
    osc.freq(random(180, 700));
    env.play();
}

// El audio necesita un gesto del usuario para arrancar (política de autoplay).
function mousePressed() {
    activarAudio();
}

function touchStarted() {
    activarAudio();
}
