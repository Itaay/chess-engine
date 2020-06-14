import chess
import chess.pgn
import numpy as np
import io

BOARD_SIZE = (8, 8)
PIECE_COUNT = 12


def create_states_dataset_from_paths(paths):
    """
    Creates a 4d tensor representing all board states in games from given paths
    :param paths:
    :return:
    """
    games = get_games_from_paths(paths)
    states = []
    for game in games:
        states += get_game_strings(game)

    tensors = []
    for state in states:
        tensors.append(string_to_tensor(state))
    return np.array(tensors)


def create_game_results_dataset_from_paths(paths):
    games = get_games_from_paths(paths)
    game_seqs = []
    results = []
    for game in games:
        final_result = game.headers["Result"]
        if final_result != '*':
            game_strings = get_game_strings(game)
            score = int(final_result.split("-")[0])  # the final score of the white side
            game_scores = np.zeros((len(game_strings)))
            i = game_scores.shape[-1] - 1
            while i >= 0:
                game_scores[i] = score
                score = 1 - score
                i -= 1

            game_seqs.append(game_strings)
            results.append(game_scores)
    game_tensors = []
    for seq in game_seqs:
        game_tensors.append(np.array([string_to_tensor(state) for state in seq]))
    return game_tensors, results


def get_games_from_paths(paths):
    games = []
    for path in paths:
        games += get_games_from_path(path)
    return games


def get_games_from_path(path):
    game_strings = get_game_strings_from_path(path)
    return [get_game_from_string(game_string) for game_string in game_strings]


def get_game_strings_from_path(path):
    games_sep = '\n\n\n'
    games = []
    with open(path, 'r') as file:
        txt = file.read()
        games = txt.split(games_sep)   # split based on enough line separations
    if games[-1] == '':     # remove empty game at the end of file if neccessary
        games = games[:-1]
    return games


def get_game_from_string(s):
    game = chess.pgn.read_game(io.StringIO(s))
    return game


def get_game_strings(game):
    """
    Get a list of all game strings of a given game object
    :param game:
    :return:
    """
    board = game.board()    # get the initial board of the game
    result = []
    for move in game.mainline_moves():  # iterate through all the moves
        board.push(move)    # go to next move
        result.append(board.fen())  # add the state's string
    return result


def get_piece_index(s):
    """
    Get the index of a given piece string in a tensor
    :param s: piece string
    :return: index
    """
    index = 0
    if s.islower(): # based on lowercase/uppercase split to two halves
        index += 6
    lowered = s.lower()
    try:
        index += 'rnbqkp'.index(lowered)  # give index based on piece type
    except Exception as e:
        print("string " + str(s) + " was not found")
        raise
    return index


def string_to_tensor(s):
    """
    Convert a given game string to a tensor
    ready to be fed to an encoder
    :param s: A game state string
    :return: a numpy array
    """
    a = np.zeros((PIECE_COUNT, BOARD_SIZE[0], BOARD_SIZE[1]))

    board_string = s[:s.index(" ")] # get only the string that represents the board itself
    rows = board_string.split("/")
    assert(len(rows) == BOARD_SIZE[0])
    for y in range(len(rows)):
        row = rows[y]
        x = 0
        for piece in row:
            if piece.isdigit():
                x += int(piece)
            else:
                a[get_piece_index(piece), y, x] = 1.0
                x += 1
    return a



paths = ["dataset/lichess_Itaay_2020-06-13.pgn"]
#   result = create_states_dataset_from_paths(paths)
#   print("result.shape: " + str(result.shape))
#   inputs, outputs = create_game_results_dataset_from_paths(paths)
#   print(outputs)
