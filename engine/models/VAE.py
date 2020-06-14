from keras.layers import Dense, Conv2D, Conv2DTranspose, Input, AveragePooling2D, Activation, Flatten, Reshape, UpSampling2D
from keras.optimizers import adam
from keras import Model
import numpy as np

def create_encoder(input_shape, output_dims, is_vae=True):
    # create an encoder model and return it
    inp = Input(input_shape)
    l1 = Conv2D(32, 3, padding="same")(inp)
    activated_l1 = Activation("relu")(l1)
    pool1 = AveragePooling2D()(activated_l1)
    l2 = Conv2D(24, 3, padding="same")(pool1)
    activated_l2 = Activation("relu")(l2)

    flattened = Flatten()(activated_l2)

    d1 = Dense(300)(flattened)
    activated_d1 = Activation("relu")(d1)

    if not is_vae:
        d2 = Dense(output_dims)(activated_d1)
        enc = Model(inp, d2)
        return enc

    mean = Dense(output_dims, name='z_mean')(activated_d1)
    var = Dense(output_dims, name='z_log_var')(activated_d1)

    enc = Model(inp, [mean, var])
    return encoder


def create_decoder(input_dims, output_shape):
    # create a decoder model and return it

    CHANNELS_LAST = True

    inp = Input(input_dims)
    # dense into the correct number
    shape = np.array(output_shape, dtype=int) // 2

    d1 = Dense(np.prod(shape))
    # reshape into a starter shape

    table1 = Reshape(shape)(d1)

    # convtrans2d
    l1 = Conv2DTranspose(output_shape[-1], 3, padding="same")(table1)
    # activation
    activatedl1 = Activation("relu")(l1)

    # upscale

    upscale1 = UpSampling2D()(activatedl1)

    # convtrans2d
    l2 = Conv2DTranspose(output_shape[-1], 3, padding="same")(upscale1)
    # activation
    activatedl2 = Activation("relu")(l2)
    # conv2d

    l3 = Conv2D(output_shape[-1], 3, padding="same")(activatedl2)
    # activation
    activatedl3 = Activation("relu")(l3)

    dec = Model(inp, activatedl3)
    return dec



def create_autoencoder():
    # create an encoder
    # create a decoder
    # create a combination layer (a sampler if doing VAE)
    # return a combined model
    pass


def load_dataset():
    #   load a wanted dataset and train on it
    pass


def train_on_set(vae, data):
    # train the given auto encoder on the given data
    pass


def save_encoder(enc):
    pass

def load_encoder():
    pass

def save_decoder(dec):
    pass

def load_decoder():
    pass

def save_vae(vae):
    pass

def load_vae():
    pass



data = load_dataset()
encoder, decoder, vae = create_autoencoder()

train_on_set(vae, data)

