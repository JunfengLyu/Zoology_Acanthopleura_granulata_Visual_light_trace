"""Paraxial scalar limiting model using Speiser et al. (2011) geometry.

No fit parameters. Not a full biaxial ray trace or a retina reconstruction.
Ray coordinates (y, n*theta); positive radii have centres to the right.
Output BFL is measured from the rear lens vertex, not L2 or a principal plane.
"""
import math

def mul(a, b):
    return [[sum(a[i][k]*b[k][j] for k in range(2)) for j in range(2)] for i in range(2)]

def refract(n1, n2, radius):
    return [[1., 0.], [-(n2-n1)/radius, 1.]]

def translate(distance, n):
    return [[1., distance/n], [0., 1.]]

if __name__ == '__main__':
    print('Scalar ABCD approximation; R1=18 um, R2=-43 um, thickness=48 um; inner n=1.336')
    print('medium, lens_n, A, C_per_um, rear_vertex_BFL_um')
    for medium, n_in in [('air', 1.), ('seawater', 1.336)]:
        for n_lens in [1.53, 1.68]:
            m = mul(refract(n_lens, 1.336, -43.), mul(translate(48., n_lens), refract(n_in, n_lens, 18.)))
            A, C = m[0][0], m[1][0]
            print(f'{medium},{n_lens:.2f},{A:.6f},{C:.6f},{-1.336*A/C:.2f}')
    na, nb, ng = 1.530, 1.681, 1.685
    V = math.asin(na/nb * math.sqrt((ng*ng-nb*nb)/(ng*ng-na*na)))
    print(f'Optic axial angle 2V_X = {2*V*180/math.pi:.3f} deg')
    print(f'Illustrative retardance = {2*math.pi*10*(ng-na)/.589:.3f} rad')
