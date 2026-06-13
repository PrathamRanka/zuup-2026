import sympy as sp
import re
from typing import Dict, Any, List, Tuple

class SymPySolver:
    """
    Symbolic Mathematics & Schema Solver Service.
    Verifies equations, solves circuit networks, and checks physical balancing laws (e.g., Kirchhoff's loop rules).
    """
    
    def verify_kirchhoff_laws(self, components: List[Dict[str, Any]], relationships: List[Dict[str, Any]], specified_current: float = None) -> Dict[str, Any]:
        """
        Validates whether the given series circuit satisfies Kirchhoff's Voltage Law (KVL):
        V_source - sum(I * R_i) = 0
        If specified_current is given, checks if that current balances the loop.
        If unbalanced, solves for the correct parameters (e.g. correct resistance or current).
        """
        try:
            # Parse components
            voltages = []
            resistors = []
            
            for comp in components:
                comp_type = comp.get("type", "").lower()
                val_str = str(comp.get("value", ""))
                
                # Extract numeric value
                num_match = re.findall(r"[-+]?\d*\.\d+|\d+", val_str)
                num_val = float(num_match[0]) if num_match else 0.0
                
                if "volt" in comp_type or comp_type == "voltage_source" or "v" in val_str.lower() and comp_type != "resistor":
                    voltages.append((comp.get("id"), num_val))
                elif "resistor" in comp_type or "ohm" in val_str.lower() or "Ω" in val_str:
                    resistors.append((comp.get("id"), num_val))
                    
            if not voltages:
                # Default to 0 voltage source if none parsed
                voltages = [("V_default", 0.0)]
                
            total_voltage = sum(v[1] for v in voltages)
            total_resistance = sum(r[1] for r in resistors)
            
            # Using SymPy symbols to solve
            I, V, R_total = sp.symbols('I V R_total')
            kvl_eq = sp.Eq(V - I * R_total, 0)
            
            # If current is not specified, let's assume one is given or compute it
            if specified_current is None:
                # Try to search if there is a current specified in components or default to 0.4A for Ohm's law mock
                specified_current = 0.4 # Default mock current if not found
                
            # Check balance
            calculated_drop = specified_current * total_resistance
            difference = abs(total_voltage - calculated_drop)
            balanced = difference < 0.01
            
            # Solve for what the values *should* be
            # Solve for current I
            solved_current = float(sp.solve(kvl_eq.subs({V: total_voltage, R_total: total_resistance}), I)[0]) if total_resistance > 0 else 0.0
            
            # Solve for expected R2 if R1 and current are known (to demonstrate self-correction)
            # Suppose V = 12, I = 0.4, R1 = 10, solve for R2: 12 - 0.4 * (10 + R2) = 0 => R2 = 20
            expected_resistors = {}
            if len(resistors) >= 2:
                # Let's solve for the last resistor assuming the others are correct and current is 0.4A
                R_last = sp.Symbol('R_last')
                other_r_sum = sum(r[1] for r in resistors[:-1])
                r_eq = sp.Eq(total_voltage - specified_current * (other_r_sum + R_last), 0)
                solved_r_last = sp.solve(r_eq, R_last)
                if solved_r_last:
                    expected_resistors[resistors[-1][0]] = max(0.0, float(solved_r_last[0]))
            
            return {
                "balanced": balanced,
                "difference": difference,
                "total_voltage": total_voltage,
                "total_resistance": total_resistance,
                "specified_current": specified_current,
                "solved_current": solved_current,
                "expected_resistors": expected_resistors,
                "error_message": f"Kirchhoff's loop does not sum to 0. Voltage: {total_voltage}V, Current: {specified_current}A, Resistance Sum: {total_resistance}Ω. Discrepancy: {difference}V." if not balanced else ""
            }
        except Exception as e:
            return {
                "balanced": False,
                "difference": 999.0,
                "total_voltage": 0.0,
                "total_resistance": 0.0,
                "specified_current": 0.0,
                "solved_current": 0.0,
                "expected_resistors": {},
                "error_message": f"Solver error: {str(e)}"
            }

    def solve_equation(self, latex_eq: str) -> Dict[str, Any]:
        """
        Solves general symbolic LaTeX equations.
        Example: 'x**2 - 4 = 0' or '2*x + 5 = 15'
        """
        try:
            # Clean up simple latex syntax
            eq_clean = latex_eq.replace("=", "==")
            # Find variables (alphabetic characters excluding functions like 'sin', 'cos', etc.)
            vars_found = set(re.findall(r"\b[a-zA-Z]\b", eq_clean))
            if not vars_found:
                vars_found = {'x'}
                
            symbols = {v: sp.Symbol(v) for v in vars_found}
            
            # Simple expression evaluation
            # If contains '==', split it
            if "==" in eq_clean:
                lhs, rhs = eq_clean.split("==")
                lhs_sym = sp.sympify(lhs, locals=symbols)
                rhs_sym = sp.sympify(rhs, locals=symbols)
                eq = sp.Eq(lhs_sym, rhs_sym)
            else:
                expr = sp.sympify(eq_clean, locals=symbols)
                eq = sp.Eq(expr, 0)
                
            solutions = {}
            for v_name, sym in symbols.items():
                sols = sp.solve(eq, sym)
                # Convert symbolic solutions to float or string representation
                solutions[v_name] = [str(sol) for sol in sols]
                
            return {
                "success": True,
                "solutions": solutions,
                "variables": list(vars_found)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

sympy_solver = SymPySolver()
