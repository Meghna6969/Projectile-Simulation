#  Kinematics Simulators
Three physically accurate physics simulators for analyzing motion and kinematics of physics.
### Try it out here: https://meghna6969.github.io/Projectile-Simulation/home.html
# Features
- **Projectile Motion Kinematic Simulator**
    - Three dimensional projectile projection
    - Two dimensional projectile physics as well
    - Inital Velocity
    - Angle X, Y, Z
    - Initial Height
    - Gravity
    - Mass of the Projectile
    - Drag/Air resistance
    - Physically Accurate details panel with time, max height, and positions for quick math
- **Incline Kinematics**
    - Switch between three and two dimensional views
    - Try multiple shapes to see how energy is different between different shapes
    - Adjust Parameters
        - Initial Velocity
        - Ramp angle
        - Ramp distance
        - Initial height
        - Kinetic friction
        - Object Mass
    - Drag/Air resistance with accurate drag forces depending on the shape
- **Relative Motion**
    - Classic River Problem physics simulation
    - Play with vectors

### Libraries Used
    - **THREE.js** (r128): 3D rendering and graphics
    - **CANNON.js**: Rigid body physics

### Physics Implementations
    - **Gravity**: Though adjustable, default 9.82 m/s² (downward)
    - **Friction**: F_k = μ × m × g × cos(θ) (When applicable)
    - **Air Resistance**: F_drag = 0.5 × ρ × v² × C_d × A

Feel very free to contribute! Most code is commented*