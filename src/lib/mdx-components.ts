// Componentes disponibles dentro de las lecciones MDX sin necesidad de
// importarlos. Para añadir uno nuevo: créalo en src/components y regístralo aquí.
import Callout from '../components/lesson/Callout.astro';
import Variable from '../components/lesson/Variable.astro';
import VariableGrid from '../components/lesson/VariableGrid.astro';
import Derivation from '../components/lesson/Derivation.astro';
import Paso from '../components/lesson/Paso.astro';
import Formula from '../components/lesson/Formula.astro';
import Reveal from '../components/lesson/Reveal.astro';
import Predict from '../components/lesson/Predict.astro';
import DecompositionDiagram from '../components/sims/DecompositionDiagram.astro';
import ProjectileLab from '../components/sims/ProjectileLab.astro';
import IndependenceDemo from '../components/sims/IndependenceDemo.astro';
import TrainFrames from '../components/sims/TrainFrames.astro';
import VelocityTriangle from '../components/sims/VelocityTriangle.astro';
import VectorDecomposition from '../components/sims/VectorDecomposition.astro';
import AngleExplorer from '../components/sims/AngleExplorer.astro';
import GuidedExample from '../components/exercises/GuidedExample.astro';

export const lessonComponents = {
	Callout,
	Variable,
	VariableGrid,
	Derivation,
	Paso,
	Formula,
	Reveal,
	Predict,
	DecompositionDiagram,
	ProjectileLab,
	IndependenceDemo,
	TrainFrames,
	VelocityTriangle,
	VectorDecomposition,
	AngleExplorer,
	GuidedExample,
};
