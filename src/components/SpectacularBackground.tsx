import { motion } from 'framer-motion';

/**
 * Ultra-Premium Animated Background Component
 * Features: Aurora borealis, geometric shapes, gradient mesh, light rays, particles
 */
export default function SpectacularBackground() {
    return (
        <div className="absolute inset-0 -z-10 overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Layer 1: Animated Gradient Mesh */}
            <div className="absolute inset-0">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-cyan-500/30 via-transparent to-transparent rounded-full blur-3xl"
                    animate={{
                        x: [0, 200, 0],
                        y: [0, 100, 0],
                        scale: [1, 1.5, 1],
                        rotate: [0, 90, 0],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-fuchsia-500/30 via-transparent to-transparent rounded-full blur-3xl"
                    animate={{
                        x: [0, -200, 0],
                        y: [0, -100, 0],
                        scale: [1, 1.4, 1],
                        rotate: [0, -90, 0],
                    }}
                    transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-gradient-to-r from-violet-500/20 via-pink-500/20 to-cyan-500/20 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, 180, 360],
                    }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                />
            </div>

            {/* Layer 2: Aurora Borealis Effect */}
            <div className="absolute inset-0">
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={`aurora-${i}`}
                        className="absolute h-1 w-full"
                        style={{
                            top: `${20 + i * 15}%`,
                            background: `linear-gradient(90deg, 
                                transparent 0%, 
                                rgba(6, 182, 212, ${0.3 + i * 0.1}) 25%, 
                                rgba(217, 70, 239, ${0.3 + i * 0.1}) 50%, 
                                rgba(139, 92, 246, ${0.3 + i * 0.1}) 75%, 
                                transparent 100%)`,
                            filter: 'blur(20px)',
                        }}
                        animate={{
                            x: ['-100%', '100%'],
                            opacity: [0, 1, 1, 0],
                        }}
                        transition={{
                            duration: 15 + i * 3,
                            repeat: Infinity,
                            delay: i * 2,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            {/* Layer 3: Floating Geometric Shapes */}
            <div className="absolute inset-0">
                {[...Array(12)].map((_, i) => {
                    const shapes = ['square', 'circle', 'triangle'];
                    const shape = shapes[i % 3];
                    const size = 40 + Math.random() * 80;

                    return (
                        <motion.div
                            key={`shape-${i}`}
                            className={`absolute ${shape === 'circle' ? 'rounded-full' :
                                    shape === 'square' ? 'rounded-lg' : ''
                                }`}
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                width: size,
                                height: size,
                                background: `linear-gradient(135deg, 
                                    rgba(6, 182, 212, 0.1), 
                                    rgba(217, 70, 239, 0.1))`,
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(10px)',
                                ...(shape === 'triangle' && {
                                    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                                }),
                            }}
                            animate={{
                                y: [0, -100, 0],
                                x: [0, Math.random() * 50 - 25, 0],
                                rotate: [0, 360],
                                scale: [1, 1.2, 1],
                            }}
                            transition={{
                                duration: 20 + Math.random() * 15,
                                repeat: Infinity,
                                delay: Math.random() * 5,
                                ease: "easeInOut",
                            }}
                        />
                    );
                })}
            </div>

            {/* Layer 4: Light Rays */}
            <div className="absolute inset-0">
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={`ray-${i}`}
                        className="absolute top-0 w-1 h-full origin-top"
                        style={{
                            left: `${i * 12.5}%`,
                            background: `linear-gradient(180deg, 
                                rgba(255, 255, 255, 0.1) 0%, 
                                transparent 50%)`,
                            transform: `rotate(${i * 5}deg)`,
                        }}
                        animate={{
                            opacity: [0.1, 0.3, 0.1],
                            scaleY: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: 8 + i,
                            repeat: Infinity,
                            delay: i * 0.5,
                        }}
                    />
                ))}
            </div>

            {/* Layer 5: Glowing Particles */}
            <div className="absolute inset-0">
                {[...Array(40)].map((_, i) => (
                    <motion.div
                        key={`particle-${i}`}
                        className="absolute rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: 2 + Math.random() * 4,
                            height: 2 + Math.random() * 4,
                            background: i % 3 === 0 ? '#06b6d4' : i % 3 === 1 ? '#d946ef' : '#8b5cf6',
                            boxShadow: `0 0 ${10 + Math.random() * 20}px currentColor`,
                        }}
                        animate={{
                            y: [0, -50 - Math.random() * 100, 0],
                            x: [0, Math.random() * 40 - 20, 0],
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                        }}
                        transition={{
                            duration: 5 + Math.random() * 5,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            {/* Layer 6: Grid Overlay */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px',
                }}
            />

            {/* Layer 7: Scanline Effect */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
                    backgroundSize: '100% 4px',
                }}
                animate={{
                    backgroundPosition: ['0% 0%', '0% 100%'],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />
        </div>
    );
}
